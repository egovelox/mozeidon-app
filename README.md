# 🌊 Swell

<small>Because no swell, no surf.</small>

A panel-based UI to browse your tabs, history and bookmarks in waves.

Unified control on multiple web-browsers and/or profiles and/or browser-windows.

[Swell](https://github.com/egovelox/swell) turns a browser-control CLI called [mozeidon](https://github.com/egovelox/mozeidon) into a panel-based UI. 🚀 

<img width="600" height="686" alt="swell_tabs_panel" src="https://github.com/user-attachments/assets/667b08c6-f61f-4fef-a6b8-df42113d1038" />


## 🏄 What you can do

From anywhere on your device, you can **control and switch to your web-browsers** :
<br>

- list your tabs, drag and drop to reorder them, and close one, or switch to one, or pin/unpin, or group one, etc
<br><br>
- list your bookmarks, open one, edit one
<br><br>
- list your history items, open one, edit one
<br><br>
- list your recently-closed tabs, open one
<br><br>
- fire a web-search on your favorite engine like in the URL bar
<br><br>
- switch to another browser, profile, or window.

<br>
In some scenarios, Swell acts in the background ( no UI ).  

It's just an os-shortcut controlling your browsers. You can
<br><br>
- define your global shortcuts to switch to the previous/next visited tab.
<br><br>
- define your global shortcut to close the current active tab.

<br>
🌊 Defining your own shorcuts is a bless ! 🌊


## 📦 Installation

Latest release ( MacOS and Linux ) : [v0.2.0](https://github.com/egovelox/swell/releases/tag/v0.2.0)

### What you need

- A recent **web-browser**
- Install this [firefox-extension](https://addons.mozilla.org/en-US/firefox/addon/mozeidon/) or [chrome extension](https://chromewebstore.google.com/detail/mozeidon/lipjcjopdojfmfjmnponpjkkccbjoipe) depending on the browser-family ( Mozilla or Chromium ) you are using.

  ✅ Swell should work directly with Firefox, Chrome, Edge  
  and with other derived browsers like Zen, Arc, Brave, etc ( requires you to create a native-manifest, see Swell Host-configuration settings ).  
  ⚠️ Swell cannot work for Safari browser.  

- Linux users only : install [wmctrl](https://en.wikipedia.org/wiki/Wmctrl) or you won't be able to switch to the browser window.
- install the app using the latest [Swell release](https://github.com/egovelox/swell/releases) based on your distribution ( Linux or MacOS ) 

### Troubleshooting

#### macOS

MacOS might prevent Swell from opening, as it's not downloaded from the Apple Store. If this happens, run:

```bash
xattr -r -d com.apple.quarantine /Applications/swell.app/
```

#### Linux

⚠️ Swell may not work well with `Gnome` desktop ( because Wayland, because focus-stealing prevention )

✅ Swell works well on `X11` with e.g `Xfce` desktop.

##### Ubuntu and Firefox sandbox 😬

On Ubuntu, the Firefox ( snap or .deb ) version might not be able to execute the `/usr/bin/mozeidon-native-app`.

To confirm it, check if you can notice something about `firefox` or `mozeidon-native-app` in :

```swift
  dmesg | grep DENIED
```

The simplest way to fix it :  

use a .deb Firefox version ( not snap ) and configure `etc/apparmor.d/usr.bin.firefox` to allow this binary :

```swift
// add this line inside the profile block
/usr/bin/mozeidon-native-app ixr,
```
and then reload `apparmor`:

```swift
sudo apparmor_parser -r /etc/apparmor.d/usr.bin.firefox
```

If you must use the snap Firefox version, surely you will have to move   
the `/usr/bin/mozeidon-native-app` binary inside `~/snap/firefox/common/mozeidon-native-app`   
and change the extension-manifest ( `~/.mozilla/native-messaging-hosts/mozeidon.json` ) to point to that binary.

## ⚙️ Swell settings

Swell settings can be modified directly inside the Swell UI.

Nonetheless, you might be interested in the underlying settings file :

#### File location

###### MacOS

`~/Library/Application Support/com.egovelox.swell/settings.json`

###### Linux

`~/.local/share/com.egovelkox.swell/settings.json`

#### Defaults ( no defined shortcuts )

```json
{
  "custom_browser_manifests": [],
  "app_settings": {
    "global_shortcut_close_current_tab": "",
    "global_shortcut_show_panel_bookmarks": "",
    "global_shortcut_show_panel_history": "",
    "global_shortcut_show_panel_recently_closed": "",
    "global_shortcut_show_panel_settings": "",
    "global_shortcut_show_panel_tabs": "",
    "global_shortcut_switch_last_visited_tab": "",
    "shortcut_close_item": "",
    "shortcut_copy_selected_item_url": "",
    "shortcut_edit_bookmark": "",
    "shortcut_hide_panel": "",
    "shortcut_list_down": "",
    "shortcut_list_up": "",
    "shortcut_next_tab": "",
    "shortcut_previous_tab": "",
    "show_favicons": true,
    "theme": "system",
    "date_locale": "en-EN",
    "web_search_engine_urls": [
      "https://www.google.com/search?q="
    ]
  }
}
```

#### Custom example with defined shortcuts :
```json
{
  "custom_browser_manifests": [],
  "app_settings": {
    "global_shortcut_close_current_tab": "Control+p",
    "global_shortcut_show_panel_bookmarks": "Control+w",
    "global_shortcut_show_panel_history": "Control+3",
    "global_shortcut_show_panel_recently_closed": "",
    "global_shortcut_show_panel_settings": "Control+2",
    "global_shortcut_show_panel_tabs": "Control+e",
    "global_shortcut_switch_last_visited_tab": "Control+Enter",
    "shortcut_close_item": "Control+l",
    "shortcut_copy_selected_item_url": "",
    "shortcut_edit_bookmark": "",
    "shortcut_hide_panel": "Control+c",
    "shortcut_list_down": "Control+j",
    "shortcut_list_up": "Control+k",
    "shortcut_next_tab": "Control+Shift+J",
    "shortcut_previous_tab": "Control+Shift+K",
    "show_favicons": true,
    "theme": "light",
    "date_locale": "en-EN",
    "web_search_engine_urls": [
      "https://www.google.com/search?q=",
      "https://addons.mozilla.org/en-US/firefox/search/?q="
    ]
  }
}
```


## 🤓 Note for mozeidon CLI users

Once you've installed Swell, you should be able to use the `mozeidon-cli` binary, if you wish !

#### macOS

`/Applications/swell.app/Contents/MacOS/mozeidon-cli`

#### Linux

`/usr/bin/mozeidon-cli`

## Planned features coming soon

- allow searching with regex
- download latest Swell release as a `brew` cask
