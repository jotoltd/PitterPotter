import SwiftUI
import UIKit

struct CachedAsyncImage: View {
    let url: URL?
    var contentMode: ContentMode = .fill

    @State private var image: UIImage?
    @State private var isLoading = false

    private static let cache = NSCache<NSURL, UIImage>()

    static func prefetch(url: URL, image: UIImage) {
        cache.setObject(image, forKey: url as NSURL)
    }

    var body: some View {
        Group {
            if let image = image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: contentMode)
            } else {
                Rectangle()
                    .fill(PPBrand.clay100)
                    .overlay(ProgressView())
            }
        }
        .task(id: url?.absoluteString) {
            await loadImage()
        }
    }

    private func loadImage() async {
        guard let url = url else { return }
        if let cached = Self.cache.object(forKey: url as NSURL) {
            image = cached
            return
        }
        do {
            let (data, _) = try await URLSession.shared.data(from: url)
            if let img = UIImage(data: data) {
                Self.cache.setObject(img, forKey: url as NSURL)
                await MainActor.run { image = img }
            }
        } catch {
            // Silent fail — placeholder will remain
        }
    }
}
