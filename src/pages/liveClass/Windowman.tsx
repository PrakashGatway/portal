// whiteboard-plugins.ts
import { WindowManager } from "@netless/window-manager";
import DocsViewer from "@netless/app-docs-viewer";
import MediaPlayer from "@netless/app-media-player";

// You MUST call register before using mount()
WindowManager.register({ kind: "DocsViewer", src: DocsViewer });
WindowManager.register({ kind: "MediaPlayer", src: MediaPlayer });

export { WindowManager };
