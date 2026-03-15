# lyfjosie.ca

Minimal art-portfolio style website for GitHub Pages.

## File structure

- `index.html`: app shell and page structure
- `styles.css`: visual design and layout
- `locations.js`: the site title, home message, and the list of image/caption/map pairs
- `script.js`: gallery rendering, tabs, sidebar toggle, and image lightbox
- `images/`: the image files used by the gallery
- `favicon.svg`: the browser tab icon, which you can replace later

## Local testing

You have two easy options.

### Option 1: just open the file

Double-click `index.html`.

This site does not require a build step.

### Option 2: run a tiny local web server

From the repo folder:

```bash
cd /Users/lyr/lyfjosie.ca
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

## How to swap images later

1. Put your new image file in `images/`
2. Open `locations.js`
3. Change the matching entry:
   - `cityName`
   - `title`
   - `description`
   - `coordinates`
   - `googleMapsLink`
   - `image.src`
   - `image.alt`

Each object in `locations.js` is one portfolio item.

## How to add a new location

Copy one object in `locations.js` and change the values.

Example:

```js
{
  cityName: "Paris",
  title: "A new memory",
  description: "Write your caption here.",
  coordinates: "48.8566, 2.3522",
  googleMapsLink: "https://maps.google.com/?q=Paris+France",
  image: {
    src: "images/paris.jpg",
    alt: "A photo from Paris",
  },
}
```

## Change the site name and home message

Open `locations.js` and edit:

```js
window.siteConfig = {
  siteName: "Fur Josie",
  homeHeadline: "Happy birthday",
};
```

## Change the browser tab icon

Replace `favicon.svg` with your own icon file and update the `<link rel="icon">` line in `index.html` if needed.

## Publish with GitHub Pages

Push this repo to GitHub, then in GitHub:

1. Open the repository
2. Go to `Settings`
3. Go to `Pages`
4. Under `Build and deployment` choose:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
5. Save

Once that is live, we can connect `lyfjosie.ca` and `www.lyfjosie.ca`.
