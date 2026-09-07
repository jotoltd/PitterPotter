import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authVM: AuthViewModel
    @State private var username = ""
    @State private var password = ""
    @FocusState private var focusedField: Field?

    private enum Field: Hashable {
        case username, password
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.white.ignoresSafeArea()

                VStack(spacing: 0) {
                    Spacer()

                    VStack(spacing: 24) {
                        VStack(spacing: 8) {
                            Text("Admin Login")
                                .font(.system(size: 30, weight: .heavy))
                                .foregroundStyle(PPBrand.charcoal)
                            Text("Pitter Potter Booking Management")
                                .font(.system(size: 12, weight: .semibold))
                                .foregroundStyle(PPBrand.charcoal.opacity(0.5))
                        }

                        VStack(spacing: 16) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("USERNAME")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(PPBrand.charcoal)
                                    .tracking(1)

                                HStack(spacing: 10) {
                                    Image(systemName: "person.fill")
                                        .font(.system(size: 14))
                                        .foregroundStyle(PPBrand.charcoal.opacity(0.3))
                                    TextField("", text: $username)
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundStyle(PPBrand.charcoal)
                                        .textInputAutocapitalization(.never)
                                        .autocorrectionDisabled()
                                        .focused($focusedField, equals: .username)
                                        .submitLabel(.next)
                                        .onSubmit { focusedField = .password }
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 10)
                                .background(PPBrand.charcoal.opacity(0.06))
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(PPBrand.charcoal.opacity(0.2), lineWidth: 1)
                                )
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                Text("PASSWORD")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(PPBrand.charcoal)
                                    .tracking(1)

                                HStack(spacing: 10) {
                                    Image(systemName: "lock.fill")
                                        .font(.system(size: 14))
                                        .foregroundStyle(PPBrand.charcoal.opacity(0.3))
                                    SecureField("", text: $password)
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundStyle(PPBrand.charcoal)
                                        .focused($focusedField, equals: .password)
                                        .submitLabel(.go)
                                        .onSubmit { Task { await login() } }
                                }
                                .padding(.horizontal, 12)
                                .padding(.vertical, 10)
                                .background(PPBrand.charcoal.opacity(0.06))
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8)
                                        .stroke(PPBrand.charcoal.opacity(0.2), lineWidth: 1)
                                )
                            }
                        }

                        if let error = authVM.error {
                            HStack(spacing: 6) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .font(.system(size: 12))
                                Text(error)
                                    .font(.system(size: 13, weight: .bold))
                            }
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        Button {
                            Task { await login() }
                        } label: {
                            if authVM.isLoading {
                                ProgressView()
                                    .tint(PPBrand.charcoal)
                                    .frame(maxWidth: .infinity, minHeight: 24)
                            } else {
                                Text("LOGIN")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundStyle(PPBrand.charcoal)
                                    .tracking(2)
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .padding(.vertical, 14)
                        .background(PPBrand.sage)
                        .clipShape(RoundedRectangle(cornerRadius: 8))
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(PPBrand.charcoal.opacity(0.2), lineWidth: 1)
                        )
                        .disabled(username.isEmpty || password.isEmpty || authVM.isLoading)
                        .opacity(username.isEmpty || password.isEmpty ? 0.5 : 1.0)
                    }
                    .padding(32)
                    .background(Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 0)
                            .stroke(PPBrand.charcoal.opacity(0.2), lineWidth: 1)
                    )
                    .padding(.horizontal, 24)

                    Spacer()
                    Spacer()

                    VStack(spacing: 2) {
                        Text("Pitter Potter")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(PPBrand.charcoal.opacity(0.4))
                        Text("Paint Your Own Pottery Studios")
                            .font(.system(size: 11))
                            .foregroundStyle(PPBrand.charcoal.opacity(0.3))
                    }
                    .padding(.bottom, 8)
                }
            }
            .navigationBarHidden(true)
        }
        .onAppear { focusedField = .username }
    }

    private func login() async {
        await authVM.login(username: username, password: password)
        if authVM.isLoggedIn {
            password = ""
        }
    }
}
