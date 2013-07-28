var cfg = require('./config.js');
var db = require('./database.js');
var r = require('./render.js');

db.database.initialise();

// Watch for changes in the posts
db.database.watch(function(post) {
  r.renderPost(post);
  r.renderIndex(db.database.posts);
});

// Watch for changes in the templates
r.watch(db.database.posts);

// Run initial rendering
r.renderAll(db.database.posts);
r.renderIndex(db.database.posts);