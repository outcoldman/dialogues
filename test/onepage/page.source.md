# Project Dialogues

Hi there, I'm Den ([outcoldman](http://outcoldman.com)) and this is project Dialogues (my first node.js project!). Do you like [Disqus](http://disqus.com/)? I do. It gives you very simple way to add support of commentaries on your website or blog. But it is too restricted, it does not allow you to change it in a way as you want it (I want to use [markdown](http://daringfireball.net/projects/markdown/)!). So this is why I decided to create project Dialogues. 

Example below, all the information after example, also you can take a look on example on jsfiddle: [http://jsfiddle.net/Wh5q7/3/](http://jsfiddle.net/Wh5q7/3/), which uses current server for storing commentaries.

## What is the Project Dialogues? 

This is how I see it:

1. Node.js server for handling commentaries.
2. Client library for communicating with server and rendering commentaries.
3. Management system for Dialogues (unspam/delete/etc for administrators).
4. At the end I'd like to make it as service in cloud with bunch of customizations and different themes (especially if I will get one of the prizes - I think this will be a good way of using free cloud services). 

This means that at the end you will have a choice to have your own server with project Dialogues or use service.

I did not have plans to build parts 3 and 4 in time of [Node.js Knockout](http://nodeknockout.com/) hackathon. But a lot of features for 1 and 2 already implemented.

### Server side features

- Support different storages: mongodb, files and in-memory storages. The last one is useful only for development. And of course you can write your own storage.
- Supports different `processors` which will be invoked before saving commentary to db (useful for checking commentaries for spam) and before sending to client (useful for setting gravatar icon). 

### Client side features
- You can renders commentaries anywhere on page (take a look on [http://jsfiddle.net/Wh5q7/3/](http://jsfiddle.net/Wh5q7/3/)).
- Each block of commentaries has identity with `host` and `id`, you can specify your own identities or script will use `document.location.host` and `document.location.path` for them.
- By default all commentaries will be rendered as plain text, but it is easy to change (examples on this page and on jsfiddle use markdown).
- I use [socket.io](http://socket.io/) for instance commentary updates (just try to open this page in two tabs and try to add commentary on one of them).
- Right now user information is stored in cookie per domain (so you will not need to re-enter it after you will come back on this page).
- I use `localStorage` for backing up your commentaries, so if your browser crashes or you accidentally close browser - don't worry, just open page and continue to write commentary.
- You can render as many commentary blocks on your page as you want (so if you use tabs or you write SPA - you can do it very easy).
- Client side supports a lot of different customizations, you can overwrite templates, behaviors and CSS classes (documentation is coming).
- As you saw in first example on this page - it supports scrolling (example on the bottom does not have scrolls).

### TODOs

And of course I have a lot of plans for future:

- Add _edit tokens_, so users will have a chance to edit their commentaries after posing them.
- Add support for oath. 
- Implement notification module, which will send emails with updates.
- Implement administrative portal for commentaries.
- Publish npm module (I don't want to do it right now, because a lot of things are going to be changed in next month, so I want first to get stable API and after this publish npm module).
- Themes, themes, themes.

### Thank you OSS!

* npm install [mongodb](https://github.com/mongodb/node-mongodb-native) - requirement only if you need mongodb as a storage.
* npm install [gravatar](https://github.com/emerleite/node-gravatar)
* npm install [underscore](http://underscorejs.org/)
* npm install [socket.io](socket.io) - if you want to support sockets.
* npm install [async](https://github.com/caolan/async)
* script src="[jquery](http://jquery.com)" - client library has dependency on it.
* script src="[socket.io](socket.io)" - not a requirement, if you will not include it - this just means no instant updates.
* script src="[momentjs](http://momentjs.com/)" - not a requirement, only if you want to format dates in human readably format as I don on this page.
* script src="[marked](https://github.com/chjj/marked)" - not a requirement, only if you want to use markdown for rendering commentaries.
* script src="[highlight](http://highlightjs.org/)" - not a requirement, only if want to use nice highlight for code.
* script src="[bootstrap](http://getbootstrap.com/)" - at current moment this library kind of depends on bootstrap, if you will not include it - you will need to write your own classes. But this is will be changed in future.

### What is next?

Let me know if you are interesting in this project. Leave comment to give me some thoughts about how you want to use it, what are the key features you want to see. And of course, please vote for it: 

