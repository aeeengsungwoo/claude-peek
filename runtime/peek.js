// claude-peek — a mascot peeks down from the top of the screen, then slides back up.
// Invoked by the Claude Code Stop hook. macOS + AppKit via JXA (osascript -l JavaScript);
// nothing to compile, ships with macOS. The character is the claude.png sitting next to
// this script. Swap that file to change it.

ObjC.import('Cocoa');
ObjC.import('QuartzCore');

// --- tweakables -------------------------------------------------------------
var charWidth  = 200;   // on-screen width in px (height follows the image aspect)
var durationMs = 340;   // slide time each way (smaller = faster)
var peek       = 12;    // how far below the top edge it stops
// ---------------------------------------------------------------------------

function imagePath() {
  // The hook invokes this script by absolute path; the PNG lives beside it.
  var args = $.NSProcessInfo.processInfo.arguments;
  for (var i = 0; i < args.count; i++) {
    var a = ObjC.unwrap(args.objectAtIndex(i));
    if (/peek\.js$/.test(a)) {
      return ObjC.unwrap(
        $(a).stringByStandardizingPath.stringByDeletingLastPathComponent
          .stringByAppendingPathComponent('claude.png')
      );
    }
  }
  return ObjC.unwrap($.NSHomeDirectory()) + '/.claude/claude-peek/claude.png';
}

function easeOutCubic(t) { var u = 1 - t; return 1 - u * u * u; }
function easeInCubic(t)  { return t * t * t; }

function slide(win, x, fromY, toY, ms, ease) {
  var start = Date.now();
  while (true) {
    var t = (Date.now() - start) / ms;
    if (t > 1) t = 1;
    var y = fromY + (toY - fromY) * ease(t);
    win.setFrameOrigin($.NSMakePoint(x, y));
    if (t >= 1) break;
    $.NSRunLoop.currentRunLoop.runUntilDate($.NSDate.dateWithTimeIntervalSinceNow(1 / 60));
  }
}

function run() {
  try {
    var imgPath = imagePath();
    if (!$.NSFileManager.defaultManager.fileExistsAtPath(imgPath)) return;

    var img = $.NSImage.alloc.initWithContentsOfFile(imgPath);
    if (img.isNil()) return;

    var size  = img.size;
    var charW = charWidth;
    var charH = Math.round(charWidth * (size.height / size.width));

    var app = $.NSApplication.sharedApplication;
    app.setActivationPolicy(1); // accessory — no Dock icon, never steals focus

    // Primary screen; Cocoa origin is bottom-left, so the top edge is origin.y + height.
    var sframe = $.NSScreen.screens.objectAtIndex(0).frame;
    var x       = sframe.origin.x + Math.round((sframe.size.width - charW) / 2);
    var topEdge = sframe.origin.y + sframe.size.height;
    var hiddenY = topEdge;                  // window sits fully above the screen
    var peekY   = topEdge - peek - charH;   // image top ends `peek` px below the top

    var win = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer(
      $.NSMakeRect(x, hiddenY, charW, charH),
      0,    // NSWindowStyleMaskBorderless
      2,    // NSBackingStoreBuffered
      false
    );
    win.setOpaque(false);
    win.setBackgroundColor($.NSColor.clearColor);
    win.setHasShadow(false);
    win.setLevel(1000);          // kCGScreenSaverWindowLevel — above the menu bar
    win.setIgnoresMouseEvents(true);
    win.setCollectionBehavior(17); // canJoinAllSpaces | stationary
    win.setReleasedWhenClosed(false);

    var iv = $.NSImageView.alloc.initWithFrame($.NSMakeRect(0, 0, charW, charH));
    iv.setImage(img);
    iv.setImageScaling(1); // NSImageScaleAxesIndependently — fill the view
    try {
      // Crisp pixel-art scaling, same idea as WPF NearestNeighbor.
      iv.setWantsLayer(true);
      iv.layer.setMagnificationFilter($('nearest'));
    } catch (e) { /* soft-fail: default smoothing is fine */ }
    win.contentView.addSubview(iv);

    win.orderFrontRegardless;

    slide(win, x, hiddenY, peekY, durationMs, easeOutCubic); // down
    slide(win, x, peekY, hiddenY, durationMs, easeInCubic);  // back up

    win.orderOut($());
  } catch (e) {
    // stay silent — a notification must never interrupt the user
  }
}
