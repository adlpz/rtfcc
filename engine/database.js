exports.database = new Database();
exports.Post = Post;

var config = require('./config.js');
var fs = require('fs');
var path = require('path');

function Post() {
  this.id = null;
  this.title = "";
  this.author = "";
  this.published = new Date();
  this.format = 'markdown';
  this.content = "";
};

Post.prototype.fromFile = function(file, callback) {
  var ext = path.extname(file);
  var bn = path.basename(file, ext);
  var parts = bn.split('.');

  if (parts.lenght >= 1) {
    var post = new this();
    post.id = parts[0];

    var fc = fs.readFile(file, {encoding: 'utf8'}, function(e,fc) {
      if (e) { return false; }

      fc = JSON.parse(fc);

      post.title = fc.title;
      post.author = fc.author;
      post.published = new Date(fc.published);
      post.format = ext;
      post.content = fc.content;

      callback(post);
    });
    return true;
  }

  return false;
}

Post.prototype.toFile = function(callback) {
  var directory = config.posts_d;
  var filename = this.id + '.' +
      this.title.toLowerCase().split(' ').join('-') +
      '.' + this.format;

  var post = {
    title: this.title,
    author: this.author,
    published: this.published.toDateString(),
    content: this.content
  };

  fs.writeFile(path.join(directory, filename),
              JSON.stringify(post),
              {encoding: 'utf8'},
              function(e) {
                if (callback) { callback(e); }
              });
}


function Database() {
  this.posts = [];
};

Database.prototype.generateId = function() {
  var maxid = -1;
  for (i = 0; i < this.posts.length; i++) {
    var id = parseInt(this.posts[i].id, 10);
    if (!isNaN(id)) {
      if (id > maxid) {
        maxid = id;
      }
    }
  }
  return maxid + 1;
}

Database.prototype.putPost = function(post) {
  if (!post.id) {
    post.id = this.generateId();
  }

  post.toFile();
}

Database.prototype.getPost = function(id) {
  for (i = 0; i < this.posts.length; i++) {
    if (this.posts[i].id == id) {
      return {i: i, p: posts[i]};
    }
  }
  return null;
}

Database.prototype.loadPost = function(filename, callback) {
  var db = this;
  var post = Post.fromFile(filename, function() {
    var existing = db.getPost(post.id);
    if (existing) {
      db.posts[existing.i] = post;
    } else {
      db.posts.push(post);
    }
    if (callback) { callback(post); }
  });
}

Database.prototype.loadAllPosts = function(callback) {
  var db = this;
  db.posts = [];
  var directory = config.posts_d;
  fs.readdir(directory, function(e, files) {
    for (i = 0; i < files.length; i++) {
      db.loadPost((files[i]));
    }
    if (callback) { callback(); }
  });
}

Database.prototype.watch = function(callback) {
  var db = this;
  var directory = config.posts_d;
  fs.watch(directory, function(event, filename) {
    if (filename) {
      db.loadPost(filename, function(post) {
        if (callback) { callback(post); }
      });
    }
  });
}

Database.prototype.initialise = function(callback) {
  this.loadAllPosts();
  this.watch(callback);
}