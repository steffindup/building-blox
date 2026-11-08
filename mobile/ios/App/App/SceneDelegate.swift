import UIKit
import AVFoundation
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = BloppitBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

// The bridge, plus the app's own small plugins (kept in this file so the Xcode project needs no new file).
class BloppitBridgeViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(OtherAudioPlugin())
    }
}

// OtherAudio: tells the game whether the player's own music (Music, Spotify…) is playing, so the island music can stay
// quiet while it does. isPlaying() → { playing }, and a "change" event when it starts or stops.
@objc(OtherAudioPlugin)
public class OtherAudioPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OtherAudioPlugin"
    public let jsName = "OtherAudio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isPlaying", returnType: CAPPluginReturnPromise)
    ]

    private func playing() -> Bool {
        let s = AVAudioSession.sharedInstance()
        return s.secondaryAudioShouldBeSilencedHint || s.isOtherAudioPlaying
    }

    override public func load() {
        NotificationCenter.default.addObserver(self, selector: #selector(hintChanged),
                                               name: AVAudioSession.silenceSecondaryAudioHintNotification, object: nil)
    }

    @objc private func hintChanged(_ note: Notification) {
        let begin = (note.userInfo?[AVAudioSessionSilenceSecondaryAudioHintTypeKey] as? UInt)
            .flatMap { AVAudioSession.SilenceSecondaryAudioHintType(rawValue: $0) } == .begin
        notifyListeners("change", data: ["playing": begin])
    }

    @objc func isPlaying(_ call: CAPPluginCall) {
        call.resolve(["playing": playing()])
    }
}
