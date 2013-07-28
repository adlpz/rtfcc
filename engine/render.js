var Mustache = require('mustache');
var fs = require('fs');
var path = require('path');
var Showdown = require('showdown');
var cfg = require('./config.js');

module.exports = new Renderer();


function Renderer() {
  this.templates = {
    header: {
      file: cfg.templates.header,
      content: null
    },
    footer: {
      file: cfg.templates.footer,
      content: null
    },
    post: {
      file: cfg.templates.post,
      content: null
    },
    index: {
      file: cfg.templates.index,
      content: null
    }
  };
  this.converters = {
    markdown: new Showdown.converter({
      extensions: [
        'twitter',
        'github',
        'table',
        'prettify'
      ]
    })
  };
};

Renderer.prototype.loadTemplate = function(template, callback) {
  fs.readFile(template.file, "utf8", function(e, d) {
    template.content = d;
    callback(template);
  })
}

Renderer.prototype.reprocessTemplate = function(template, posts) {
  this.loadTemplate(template, function(t) {
    this.renderAll(posts);
    this.renderIndex(posts);
  });
}

Renderer.prototype.watch = function(posts) {
  var templates = [
    this.templates.header,
    this.templates.footer,
    this.templates.post,
    this.templates.index
  ];

  for (i = 0; i < templates.length; i++) {
    fs.watch(templates[i].file, function(e, fn) {
      var t = templates[i];
      this.reprocessTemplate(t, posts);
    });
  }
}

Renderer.prototype.renderHeader = function(post) {
  return Mustache.render(this.templates.header.content, {post: post});
}

Renderer.prototype.renderFooter = function() {
  return Mustache.render(this.templates.footer.content, {});
}

Renderer.prototype.renderPostContent = function(post) {
  var postc = JSON.parse(JSON.stringify(post));
  if (postc.format == 'markdown') {
    postc.content = this.converters.markdown.makeHtml(postc.content);
  }
  return Mustache.render(this.templates.post.content, postc)
}

Renderer.prototype.renderIndexContent = function(posts) {
  return Mustache.render(this.templates.index.content, posts);
}

Renderer.prototype.render = function(html, filename) {
  fs.writeFile(
    path.join(cfg.render_d, filename),
    html,
    {ecoding: 'utf8'},
    function(){}
  );
}

Renderer.prototype.renderPost = function(post) {
  var html =
      this.renderHeader(post) +
      this.renderPostContent(post) +
      this.renderFooter();
  var filename = post.title.toLowerCase().split(' ').join('-') + '.html';

  this.render(html, filename);
};

Renderer.prototype.renderAll = function(posts) {
  for (i = 0; i < posts.length; i++) {
    this.renderPost(posts[i]);
  }
}

Renderer.prototype.renderIndex = function(posts) {
  var html =
      this.renderHeader() +
      this.renderIndexContent(posts) +
      this.renderFooter();
  var filename = cfg.templates.index;

  this.render(html, filename);
};