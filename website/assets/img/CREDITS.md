# Photo credits

The gallery photographs are from **Unsplash**, under the
[Unsplash License](https://unsplash.com/license) — free for commercial and
non-commercial use, no permission or attribution required. They are credited
here anyway, and stored locally rather than hotlinked.

| File | Source |
| --- | --- |
| `everest-stupa.jpg` | https://unsplash.com/photos/1544735716-392fe2489ffa |
| `amadablam-dusk.jpg` | https://unsplash.com/photos/1533130061792-64b345e4a833 |
| `boudhanath-aerial.jpg` | https://unsplash.com/photos/1605640840605-14ac1855827b |
| `trekker-cairn.jpg` | https://unsplash.com/photos/1526772662000-3f88f10405ff |
| `amadablam-storm.jpg` | https://unsplash.com/photos/1486911278844-a81c5267e227 |

## Why these are served from `assets/img/` and not from Pinterest

Pinterest was the original request, and it does not work here for three
independent reasons — any one of them alone would be enough:

1. **The site's own CSP forbids it.** Every page sends
   `img-src 'self' data:`, so an `<img>` pointing at any other origin is
   blocked by the browser before a request is even made.
2. **Pinterest blocks hotlinking.** Its CDN checks the referrer and its terms
   prohibit embedding pinned images on other sites, so the URLs rot or start
   returning errors without warning.
3. **Pins are not licensed for reuse.** A pin is a bookmark to someone else's
   photograph. Pinterest grants no right to republish it, and the photographer
   usually has not either.

Unsplash gives the same kind of imagery with an explicit licence to use it.
To add more, download the file into this folder and add a row above — do not
reference a remote URL, or the CSP will drop it.
