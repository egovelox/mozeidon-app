# 🌊 Swell

<small>Because no swell, no surf.</small>

A panel-based UI to browse your tabs, history and bookmarks in waves.

[Swell](https://github.com/egovelox/swell) turns a browser-control CLI called [mozeidon](https://github.com/egovelox/mozeidon) into a panel-based UI. 🚀 

<img width="600" height="686" alt="swell_tabs_panel" src="https://github.com/user-attachments/assets/667b08c6-f61f-4fef-a6b8-df42113d1038" />


## 🏄 What you can do

From anywhere on your device, **control and switch to your web-browser** :
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

<br>
Note in some scenarios, Swell UI won't be displayed, it acts in the background just like an os-shortcut controlling your browser :
<br><br>

- define your global shortcut to switch to the previous visited tab.
<br><br>
- define your global shortcut to close the current tab.

<br>
🌊 Defining your own shorcuts is a bless ! 🌊


## 📦 Installation

Latest release ( MacOS and Linux ) : [v0.1.1](https://github.com/egovelox/swell/releases/tag/v0.1.1)

### What you need

- A recent **web-browser**
- Install this [firefox-extension](https://addons.mozilla.org/en-US/firefox/addon/mozeidon/) or [chrome extension](https://chromewebstore.google.com/detail/mozeidon/lipjcjopdojfmfjmnponpjkkccbjoipe) depending on the browser-family ( Mozilla or Chromium ) you are using.

  ✅ Swell should work directly with Firefox, Chrome, Edge  
  and with other derived browsers like Zen, Arc, Brave, etc ( requires you to create a native-manifest, see Swell Host-configuration settings ).  
  ⚠️ Swell cannot work for Safari browser.  
  ⚠️ You cannot use Swell on multiple browser-windows or profiles at the same time.  
  ⚠️ You cannot use Swell on multiple browsers at the same time.   
    Make sure the extension is active in only one browser.  

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
    "date_locale": "en-EN",
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
    "show_favicons": true,
    "theme": "system",
    "web_browser": "firefox",
    "web_search_engine_urls": [
      "https://www.google.com/search?q=",
      "https://addons.mozilla.org/en-US/firefox/search/?q="
    ]
  }
}
```

#### Custom example with defined shortcuts :
```json
{
  "custom_browser_manifests": [],
  "app_settings": {
    "date_locale": "en-EN",
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
    "show_favicons": true,
    "theme": "light",
    "web_browser": "Google Chrome",
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
