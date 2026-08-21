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
                PPBrand.headerGradient
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    Spacer()

                    VStack(spacing: 20) {
                        Image("BrandLogo")
                            .resizable()
                            .scaledToFit()
                            .frame(height: 72)

                        VStack(spacing: 4) {
                            Text("ADMIN")
                                .font(.system(size: 13, weight: .heavy))
                                .foregroundStyle(.white.opacity(0.6))
                                .tracking(6)
                                .textCase(.uppercase)
                            Text("Pitter Potter")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(.white)
                        }
                    }

                    Spacer()

                    VStack(spacing: 16) {
                        VStack(spacing: 12) {
                            HStack(spacing: 10) {
                                Image(systemName: "person.fill")
                                    .font(.system(size: 15))
                                    .foregroundStyle(.white.opacity(0.4))
                                TextField("Username", text: $username)
                                    .font(.system(size: 15))
                                    .foregroundStyle(.white)
                                    .textInputAutocapitalization(.never)
                                    .autocorrectionDisabled()
                                    .focused($focusedField, equals: .username)
                                    .submitLabel(.next)
                                    .onSubmit { focusedField = .password }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 14)
                            .background(.white.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(.white.opacity(0.15), lineWidth: 1)
                            )

                            HStack(spacing: 10) {
                                Image(systemName: "lock.fill")
                                    .font(.system(size: 15))
                                    .foregroundStyle(.white.opacity(0.4))
                                SecureField("Password", text: $password)
                                    .font(.system(size: 15))
                                    .foregroundStyle(.white)
                                    .focused($focusedField, equals: .password)
                                    .submitLabel(.go)
                                    .onSubmit { Task { await login() } }
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 14)
                            .background(.white.opacity(0.08))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(.white.opacity(0.15), lineWidth: 1)
                            )
                        }

                        if let error = authVM.error {
                            HStack(spacing: 6) {
                                Image(systemName: "exclamationmark.triangle.fill")
                                    .font(.system(size: 12))
                                Text(error)
                                    .font(.system(size: 13, weight: .medium))
                            }
                            .foregroundStyle(.red.opacity(0.9))
                            .frame(maxWidth: .infinity, alignment: .leading)
                        }

                        Button {
                            Task { await login() }
                        } label: {
                            if authVM.isLoading {
                                ProgressView()
                                    .tint(.white)
                                    .frame(maxWidth: .infinity, minHeight: 24)
                            } else {
                                Text("Sign In")
                                    .font(.system(size: 16, weight: .bold))
                                    .frame(maxWidth: .infinity)
                            }
                        }
                        .padding(.vertical, 16)
                        .background(.white)
                        .foregroundStyle(PPBrand.charcoal)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .disabled(username.isEmpty || password.isEmpty || authVM.isLoading)
                        .opacity(username.isEmpty || password.isEmpty ? 0.5 : 1.0)
                    }
                    .padding(24)
                    .background(.white.opacity(0.05))
                    .clipShape(RoundedRectangle(cornerRadius: 20))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(.white.opacity(0.1), lineWidth: 1)
                    )
                    .padding(.horizontal, 32)
                    .shadow(color: .black.opacity(0.2), radius: 20, y: 10)

                    Spacer()
                    Spacer()

                    VStack(spacing: 2) {
                        Text("Pitter Potter")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.white.opacity(0.4))
                        Text("Paint Your Own Pottery Studios")
                            .font(.system(size: 11))
                            .foregroundStyle(.white.opacity(0.3))
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
