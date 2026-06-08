# claude-peek — a mascot peeks down from the top of the screen, then slides back up.
# Invoked by the Claude Code Stop hook. Windows + WPF; must run under powershell.exe (STA).
# The character is the claude.png sitting next to this script. Swap that file to change it.

$ErrorActionPreference = 'Stop'

# --- tweakables -------------------------------------------------------------
$charWidth  = 200    # on-screen width in px (height follows the image aspect)
$durationMs = 340    # slide time each way (smaller = faster)
$peek       = 12     # how far below the top edge it stops
# ---------------------------------------------------------------------------

try {
    Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase

    $imgPath = Join-Path $PSScriptRoot 'claude.png'
    if (-not (Test-Path $imgPath)) { return }

    $src = New-Object System.Windows.Media.Imaging.BitmapImage
    $src.BeginInit()
    $src.UriSource   = New-Object System.Uri($imgPath)
    $src.CacheOption = 'OnLoad'
    $src.EndInit()

    $charW = $charWidth
    $charH = [int][Math]::Round($charWidth * ($src.PixelHeight / $src.PixelWidth))

    $winW   = $charW + 80
    $winH   = $charH + 48
    $hidden = -($charH + 12)   # fully above the screen
    $peekY  = $peek

    $w = New-Object System.Windows.Window
    $w.WindowStyle        = 'None'
    $w.AllowsTransparency  = $true
    $w.Background         = [System.Windows.Media.Brushes]::Transparent
    $w.Topmost            = $true
    $w.ShowInTaskbar      = $false
    $w.ShowActivated      = $false   # never steals focus
    $w.Width = $winW; $w.Height = $winH
    $w.WindowStartupLocation = 'Manual'
    $sw = [System.Windows.SystemParameters]::PrimaryScreenWidth
    $w.Left = [Math]::Round(($sw - $winW) / 2)
    $w.Top  = 0

    $img = New-Object System.Windows.Controls.Image
    $img.Source  = $src
    $img.Width   = $charW
    $img.Height  = $charH
    $img.Stretch = 'Fill'
    [System.Windows.Media.RenderOptions]::SetBitmapScalingMode($img, [System.Windows.Media.BitmapScalingMode]::NearestNeighbor)
    $img.HorizontalAlignment = 'Center'
    $img.VerticalAlignment   = 'Top'
    $trans = New-Object System.Windows.Media.TranslateTransform(0, $hidden)
    $img.RenderTransform = $trans

    $grid = New-Object System.Windows.Controls.Grid
    [void]$grid.Children.Add($img)
    $w.Content = $grid

    $script:w     = $w
    $script:trans = $trans
    $script:from  = [double]$hidden
    $script:to    = [double]$peekY
    $script:ms    = $durationMs

    $w.Add_Loaded({
        $ease = New-Object System.Windows.Media.Animation.CubicEase
        $ease.EasingMode = 'EaseOut'
        $dur  = New-Object System.Windows.Duration([TimeSpan]::FromMilliseconds($script:ms))
        $anim = New-Object System.Windows.Media.Animation.DoubleAnimation($script:from, $script:to, $dur)
        $anim.EasingFunction = $ease
        $anim.AutoReverse    = $true       # down, then automatically back up
        $anim.Add_Completed({ $script:w.Close() })
        $script:trans.BeginAnimation([System.Windows.Media.TranslateTransform]::YProperty, $anim)
    })

    $w.Add_Closed({ $w.Dispatcher.InvokeShutdown() })
    $w.Show()
    [System.Windows.Threading.Dispatcher]::Run()
}
catch {
    # stay silent — a notification must never interrupt the user
}
