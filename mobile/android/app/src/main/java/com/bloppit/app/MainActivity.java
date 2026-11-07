package com.bloppit.app;

import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onStart() {
        super.onStart();
        // The launch screen plays the boys' "Bloppit" and the films start on their own, as in the iPhone app
        // (Capacitor's iOS config sets mediaTypesRequiringUserActionForPlayback = []).
        if (getBridge() != null) {
            WebView wv = getBridge().getWebView();
            if (wv != null) wv.getSettings().setMediaPlaybackRequiresUserGesture(false);
        }
    }
}
