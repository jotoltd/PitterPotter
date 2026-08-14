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
            VStack(spacing: 24) {
                Spacer()

                VStack(spacing: 16) {
                    Image("BrandLogo")
                        .resizable()
                        .scaledToFit()
                        .frame(height: 64)

                    VStack(spacing: 4) {
                        Text("Admin")
                            .font(PPBrand.bodyFontSmall)
                            .fontWeight(.medium)
                            .foregroundStyle(PPBrand.charcoal.opacity(0.6))
                            .tracking(4)
                            .textCase(.uppercase)
                    }
                }

                Spacer()

                VStack(spacing: 16) {
                    TextField("Username", text: $username)
                        .textFieldStyle(.roundedBorder)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .focused($focusedField, equals: .username)
                        .submitLabel(.next)
                        .onSubmit { focusedField = .password }

                    SecureField("Password", text: $password)
                        .textFieldStyle(.roundedBorder)
                        .focused($focusedField, equals: .password)
                        .submitLabel(.go)
                        .onSubmit { Task { await login() } }

                    if let error = authVM.error {
                        Text(error)
                            .font(PPBrand.bodyFontCaption)
                            .foregroundStyle(.red)
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
                                .font(PPBrand.bodyFont)
                                .fontWeight(.bold)
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(PPBrand.charcoal)
                    .controlSize(.large)
                    .disabled(username.isEmpty || password.isEmpty || authVM.isLoading)
                }
                .padding(.horizontal, 32)

                Spacer()
                Spacer()

                VStack(spacing: 2) {
                    Text("Pitter Potter")
                        .font(PPBrand.bodyFontCaption)
                        .fontWeight(.medium)
                        .foregroundStyle(PPBrand.charcoal.opacity(0.4))
                    Text("Paint Your Own Pottery Studios")
                        .font(PPBrand.bodyFontCaption)
                        .foregroundStyle(PPBrand.charcoal.opacity(0.3))
                }
            }
            .navigationBarHidden(true)
            .background(PPBrand.brandBackground)
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
