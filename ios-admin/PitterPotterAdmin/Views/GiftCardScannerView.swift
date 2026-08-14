import SwiftUI
import AVFoundation

struct GiftCardScannerView: UIViewControllerRepresentable {
    @Binding var scannedCode: String?
    @Environment(\.dismiss) var dismiss

    func makeUIViewController(context: Context) -> ScannerViewController {
        let vc = ScannerViewController()
        vc.delegate = context.coordinator
        return vc
    }

    func updateUIViewController(_ vc: ScannerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, ScannerViewControllerDelegate {
        let parent: GiftCardScannerView

        init(_ parent: GiftCardScannerView) {
            self.parent = parent
        }

        func didFindCode(_ code: String) {
            DispatchQueue.main.async {
                self.parent.scannedCode = code
                self.parent.dismiss()
            }
        }
    }
}

protocol ScannerViewControllerDelegate: AnyObject {
    func didFindCode(_ code: String)
}

final class ScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    weak var delegate: ScannerViewControllerDelegate?
    private let session = AVCaptureSession()
    private var previewLayer: AVCaptureVideoPreviewLayer?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        setupSession()
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        if !session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                self?.session.startRunning()
            }
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        session.stopRunning()
    }

    private func setupSession() {
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device) else {
            addNoCameraLabel()
            return
        }

        session.addInput(input)
        let output = AVCaptureMetadataOutput()
        session.addOutput(output)
        output.setMetadataObjectsDelegate(self, queue: .main)
        output.metadataObjectTypes = [.qr, .code128, .code39, .code93, .ean13, .ean8, .pdf417]

        let preview = AVCaptureVideoPreviewLayer(session: session)
        preview.frame = view.layer.bounds
        preview.videoGravity = .resizeAspectFill
        view.layer.addSublayer(preview)
        previewLayer = preview

        addReticle()
    }

    private func addReticle() {
        let reticle = UIView()
        reticle.layer.borderColor = UIColor.white.cgColor
        reticle.layer.borderWidth = 2
        reticle.layer.cornerRadius = 12
        reticle.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(reticle)

        NSLayoutConstraint.activate([
            reticle.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            reticle.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            reticle.widthAnchor.constraint(equalTo: view.widthAnchor, multiplier: 0.7),
            reticle.heightAnchor.constraint(equalTo: reticle.widthAnchor, multiplier: 0.5),
        ])
    }

    private func addNoCameraLabel() {
        let label = UILabel()
        label.text = "Camera not available\nEnter code manually"
        label.textColor = .white
        label.textAlignment = .center
        label.numberOfLines = 0
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.layer.bounds
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        if let obj = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
           let code = obj.stringValue {
            delegate?.didFindCode(code)
        }
    }
}
