import SwiftUI

extension Font {
    static func heading(size: CGFloat) -> Font {
        .system(size: size, weight: .light)
    }
    
    static func body(size: CGFloat) -> Font {
        .system(size: size, weight: .regular)
    }
}
