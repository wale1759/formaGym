# Learning your way around FORMA

You do not need to understand the whole app at once. Start with a small visible change, then follow where its data comes from.

## Start here

1. Follow the README to start the app. Keep it running while you read.
2. Open frontend/src/main.jsx. It puts the app on the page.
3. Open frontend/src/components/Button.jsx. It draws one reusable button.
4. Open frontend/src/data/products.js. Each product has named facts such as name and price.
5. Open frontend/src/components/ProductCards.jsx. It turns those facts into cards.
6. Open frontend/src/App.jsx. It remembers shared choices and decides which screen to show.

## Words you will meet

| Word | Meaning in this project |
| --- | --- |
| Frontend | The code that runs in the browser and draws the pages. |
| Backend | The server code that checks requests and talks to the database. |
| Component | A function that describes a piece of the screen, such as a button. |
| JSX | The HTML-like part of a React JavaScript file. It describes what to draw. |
| Prop | A value or function a parent component gives to a child. |
| State | A value React remembers. Changing it asks React to update the screen. |
| Callback | A function passed to another piece of code to run later, often after a click. |
| Hook | A React function such as useState or useEffect, or a reusable function built from them. |
| API | The agreed URLs and messages the browser and server use to communicate. |
| Request / response | A message sent to the server / the server's reply. |
| async / await | A way to wait for work such as a network request without freezing the whole app. |
| JSON | A text format for sending or saving objects and lists. |
| Database | The server's lasting storage. This app uses MongoDB. |
| Validation | Checking that data has the expected shape and allowed values. |
| Authentication | Checking who someone is when they sign in. |
| Authorization | Checking whether that person may perform a particular action. |
| Session | A temporary sign-in record. It expires even though the account still exists. |
| Cookie | A browser-stored value sent with matching requests. Our session cookies cannot be read by browser JavaScript. |
| Hash | A computed fingerprint. Passwords and session tokens use different hashing approaches here. Do not replace these with homemade security code. |
| Test | Code that checks whether a particular behavior still works. |

## Follow a click

For the shop, read these steps in order:

1. The product catalog supplies a product's name, price, image and category.
2. ProductCards receives a list of products as props and draws one card for each product.
3. Clicking Add to cart calls onAdd with the chosen product.
4. App adds the product to cart state, or increases its quantity.
5. React updates the screen. useStored also tries to save the cart in this browser.
6. On a later visit, storage.js checks saved entries before the app uses them.

Browser storage is a convenience. It is not the database, proof of payment, or permission to access another person's account.

## Follow a form

The browser sends a form to an /api URL. The matching server route validates the data, checks permission when needed, and saves allowed fields through database.js. The server then returns a result that the screen can show. A browser check helps the user, but the server must check the request too.

## Read the stylesheet

Start at the section comments in frontend/src/styles.css. A selector chooses elements; declarations inside braces describe their appearance. A variable such as --red stores a reusable value. A media query applies rules under a condition such as a narrow screen.

Later matching rules can override earlier ones. Read nearby rules before changing a selector, and check both a wide screen and a phone-sized screen. Formatting is safe; moving rules can change the appearance.

## Try a small change

Change one product description or one button label, then look at the page. Predict the result before saving. Check the diff (the list of changed lines) so you know exactly what changed. Restore the original text if it was only practice.

Before changing signup, passwords, permissions or stored data, read the matching backend tests with someone who understands that area.

## Check your work

- npm run lint: checks for common coding mistakes and requires clear braces around control flow.
- npm run format: applies consistent spacing and line breaks.
- npm run format:check: checks formatting without changing files.
- npm test: runs backend checks using a separate temporary test database.
- npm run build: checks that the website can be packaged for production.
- npm run test:ui --workspace frontend: checks browser flows using mocked API responses and an installed Chrome browser.

On Windows, use npm.cmd if PowerShell blocks npm scripts. The first backend test run may download a MongoDB test binary. None of these checks proves the app is ready to take payments or operate a real gym.
