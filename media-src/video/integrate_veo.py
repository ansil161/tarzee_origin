"""Download Veo hero clips, grade them monochrome, encode for web, install into theme/preview and re-cut the brand film.
Usage: python media-src/video/integrate_veo.py <url_16x9_a> <url_16x9_b> <url_9x16>
"""
import os, sys, subprocess, urllib.request, shutil
V = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(V))
ASSETS = os.path.join(ROOT, 'theme', 'assets')
os.chdir(V)
urls = sys.argv[1:4]
names = ['veo-hero-a.mp4', 'veo-hero-b.mp4', 'veo-hero-mobile.mp4']
for u, n in zip(urls, names):
    print('download', n); urllib.request.urlretrieve(u, 'raw-' + n)
def ff(args): print(' '.join(args[:6]), '...'); subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)
GRADE = 'hue=s=0,eq=contrast=1.08:brightness=-0.01,noise=alls=4:allf=t+u,format=yuv420p'
# desktop hero: clip A + clip B crossfaded into a 16 s loop
ff(['-i', 'raw-veo-hero-a.mp4', '-i', 'raw-veo-hero-b.mp4', '-filter_complex',
    f'[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1[a];[1:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,setsar=1[b];[a][b]xfade=transition=fade:duration=1:offset=7,{GRADE}[v]',
    '-map', '[v]', '-r', '24', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-maxrate', '6M', '-bufsize', '12M', '-tune', 'film', '-movflags', '+faststart', '-an', 'hero-veo-1920.mp4'])
ff(['-i', 'hero-veo-1920.mp4', '-ss', '3', '-frames:v', '1', '-q:v', '3', 'hero-veo-poster.jpg'])
# mobile hero
ff(['-i', 'raw-veo-hero-mobile.mp4', '-vf', f'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,{GRADE}',
    '-r', '24', '-c:v', 'libx264', '-preset', 'slow', '-crf', '25', '-maxrate', '3M', '-bufsize', '6M', '-tune', 'film', '-movflags', '+faststart', '-an', 'hero-veo-mobile-720x1280.mp4'])
ff(['-i', 'hero-veo-mobile-720x1280.mp4', '-ss', '2', '-frames:v', '1', '-q:v', '3', 'hero-veo-mobile-poster.jpg'])
# brand film: veo A -> veo B -> craft (16:9 padded) -> end card
ff(['-i', 'hero-veo-1920.mp4', '-i', 'clips/craft169.mp4', '-i', 'clips/end.mp4', '-filter_complex',
    '[0:v]fps=25[a];[a][1:v]xfade=transition=fade:duration=1:offset=14[ab];[ab][2:v]xfade=transition=fade:duration=1:offset=29,fade=t=in:st=0:d=1,fade=t=out:st=32:d=1,format=yuv420p[v]',
    '-map', '[v]', '-r', '25', '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-maxrate', '5M', '-bufsize', '10M', '-tune', 'film', '-movflags', '+faststart', '-an', 'brand-film-1920.mp4'])
ff(['-i', 'brand-film-1920.mp4', '-ss', '5', '-frames:v', '1', '-q:v', '3', 'brand-film-poster.jpg'])
for f in ['hero-veo-1920.mp4', 'hero-veo-poster.jpg', 'hero-veo-mobile-720x1280.mp4', 'hero-veo-mobile-poster.jpg', 'brand-film-1920.mp4', 'brand-film-poster.jpg']:
    shutil.copy(f, ASSETS); print('installed', f, round(os.path.getsize(f) / 1e6, 2), 'MB')
