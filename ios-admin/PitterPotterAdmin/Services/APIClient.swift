import Foundation

// MARK: - API Configuration

enum APIConfig {
    // These will be set from the app's settings or hardcoded for now.
    // You can change these to your Supabase project URL and anon key.
    static let supabaseURL = ProcessInfo.processInfo.environment["SUPABASE_URL"]
        ?? "https://your-project.supabase.co"
    static let supabaseAnonKey = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"]
        ?? "your-anon-key"

    static let bookingsEndpoint = "\(supabaseURL)/functions/v1/admin-bookings"
    static let loginEndpoint = "\(supabaseURL)/functions/v1/staff-login"
    static let contentEndpoint = "\(supabaseURL)/functions/v1/admin-content"
}

// MARK: - API Client

actor APIClient {
    static let shared = APIClient()

    private let session: URLSession

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 120
        session = URLSession(configuration: config)
    }

    // MARK: - Auth

    func login(username: String, password: String) async throws -> Staff {
        var request = URLRequest(url: URL(string: APIConfig.loginEndpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(APIConfig.supabaseAnonKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(["username": username, "password": password])

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        if http.statusCode == 401 {
            throw APIError.invalidCredentials
        }
        guard http.statusCode == 200 else {
            let error = try? JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(error?.error ?? "Login failed")
        }
        return try JSONDecoder().decode(Staff.self, from: data)
    }

    // MARK: - Bookings

    func loadBookings(staff: Staff) async throws -> [Booking] {
        var request = URLRequest(url: URL(string: APIConfig.bookingsEndpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(APIConfig.supabaseAnonKey)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "action": "load",
            "username": staff.username,
            "sessionToken": staff.sessionToken,
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        if http.statusCode == 401 {
            throw APIError.unauthorized
        }
        guard http.statusCode == 200 else {
            let error = try? JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(error?.error ?? "Failed to load bookings")
        }
        return try JSONDecoder().decode([Booking].self, from: data)
    }

    func updateBooking(_ booking: Booking, staff: Staff) async throws {
        var request = URLRequest(url: URL(string: APIConfig.bookingsEndpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(APIConfig.supabaseAnonKey)", forHTTPHeaderField: "Authorization")

        let bookingDict = try booking.toDictionary()
        let body: [String: Any] = [
            "action": "update",
            "username": staff.username,
            "sessionToken": staff.sessionToken,
            "booking": bookingDict,
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        if http.statusCode == 401 {
            throw APIError.unauthorized
        }
        guard http.statusCode == 200 else {
            let error = try? JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(error?.error ?? "Failed to update booking")
        }
    }

    func updateBookingStatus(id: String, status: String, staff: Staff) async throws {
        var request = URLRequest(url: URL(string: APIConfig.bookingsEndpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(APIConfig.supabaseAnonKey)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "action": "updateStatus",
            "username": staff.username,
            "sessionToken": staff.sessionToken,
            "id": id,
            "status": status,
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        if http.statusCode == 401 {
            throw APIError.unauthorized
        }
        guard http.statusCode == 200 else {
            let error = try? JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(error?.error ?? "Failed to update status")
        }
    }

    // MARK: - Photo Upload

    func uploadPhoto(imageData: Data, fileName: String, bookingId: String, staff: Staff) async throws -> String {
        let base64 = imageData.base64EncodedString()
        let dataUrl = "data:image/jpeg;base64,\(base64)"

        var request = URLRequest(url: URL(string: APIConfig.contentEndpoint)!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(APIConfig.supabaseAnonKey)", forHTTPHeaderField: "Authorization")

        let body: [String: Any] = [
            "action": "upload",
            "username": staff.username,
            "sessionToken": staff.sessionToken,
            "key": "booking_\(bookingId)_photo_\(Int(Date().timeIntervalSince1970 * 1000))",
            "page": "booking-photos",
            "fileData": dataUrl,
            "fileName": fileName,
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        guard http.statusCode == 200 else {
            let error = try? JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(error?.error ?? "Upload failed")
        }

        let result = try JSONDecoder().decode(UploadResponse.self, from: data)
        return result.url
    }
}

// MARK: - Helpers

extension Booking {
    func toDictionary() throws -> [String: Any] {
        let data = try JSONEncoder().encode(self)
        let dict = try JSONSerialization.jsonObject(with: data) as? [String: Any] ?? [:]
        return dict
    }
}

// MARK: - Response Types

struct ErrorResponse: Codable {
    let error: String?
}

struct UploadResponse: Codable {
    let url: String
}

// MARK: - Errors

enum APIError: LocalizedError {
    case invalidResponse
    case invalidCredentials
    case unauthorized
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse: return "Invalid server response"
        case .invalidCredentials: return "Invalid username or password"
        case .unauthorized: return "Session expired. Please log in again."
        case .serverError(let msg): return msg
        }
    }
}
