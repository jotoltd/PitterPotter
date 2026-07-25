import SwiftUI

struct GalleryView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var selectedImage: Int? = nil
    @State private var showImageDetail = false
    
    let galleryItems = [
        "Pottery Painting",
        "Baby Prints",
        "Birthday Parties",
        "Studio Atmosphere",
        "Finished Pieces",
        "Creative Process",
        "Group Sessions",
        "Seasonal Decor"
    ]
    
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header
                header
                
                // Gallery Grid
                galleryGrid
            }
        }
        .background(Color.clayWhite)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button("Back") {
                    dismiss()
                }
            }
        }
        .sheet(isPresented: $showImageDetail) {
            if let index = selectedImage {
                ImageDetailView(index: index, title: galleryItems[index])
            }
        }
    }
    
    private var header: some View {
        VStack(spacing: 12) {
            Text("Gallery")
                .font(.heading(size: 28))
                .foregroundColor(.clayCharcoal)
                .padding(.top, 20)
            
            Text("Explore our pottery creations and studio moments")
                .font(.body(size: 14))
                .foregroundColor(.clayCharcoal.opacity(0.7))
                .multilineTextAlignment(.center)
        }
        .padding()
    }
    
    private var galleryGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 12) {
            ForEach(0..<galleryItems.count, id: \.self) { index in
                Button(action: {
                    selectedImage = index
                    showImageDetail = true
                }) {
                    VStack(spacing: 8) {
                        Rectangle()
                            .fill(Color.terracottaLight.opacity(0.5))
                            .aspectRatio(1, contentMode: .fit)
                            .cornerRadius(12)
                            .overlay(
                                VStack {
                                    Image(systemName: "photo")
                                        .font(.system(size: 30))
                                        .foregroundColor(.clayCharcoal.opacity(0.3))
                                }
                            )
                        
                        Text(galleryItems[index])
                            .font(.body(size: 12))
                            .foregroundColor(.clayCharcoal)
                    }
                }
                .buttonStyle(PlainButtonStyle())
            }
        }
        .padding()
    }
}

struct ImageDetailView: View {
    @Environment(\.dismiss) private var dismiss
    let index: Int
    let title: String
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Large image placeholder
                Rectangle()
                    .fill(Color.terracottaLight.opacity(0.5))
                    .aspectRatio(1, contentMode: .fit)
                    .overlay(
                        VStack {
                            Image(systemName: "photo")
                                .font(.system(size: 60))
                                .foregroundColor(.clayCharcoal.opacity(0.3))
                            Text(title)
                                .font(.heading(size: 20))
                                .foregroundColor(.clayCharcoal.opacity(0.5))
                                .padding(.top, 12)
                        }
                    )
                    .cornerRadius(12)
                
                // Description
                VStack(alignment: .leading, spacing: 12) {
                    Text(title)
                        .font(.heading(size: 24))
                        .foregroundColor(.clayCharcoal)
                    
                    Text("Beautiful pottery created at Pitter Potter studio. Each piece is unique and hand-painted with care.")
                        .font(.body(size: 14))
                        .foregroundColor(.clayCharcoal.opacity(0.85))
                        .lineSpacing(4)
                }
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
                
                Spacer()
            }
            .padding()
            .background(Color.clayWhite)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    NavigationView {
        GalleryView()
    }
}
