react-server-example
--------------------
一个简单（无编译）的示例,如何使用[React](http://facebook.github.io/react/) 做服务器端的渲染，使组件代码可以
在服务器和浏览器之间共享， 以及获得快速加载的初始页面
和友好型搜索引擎页面。

有关共享路由、数据提取的更复杂的示例，请参见
[react-server-routing-example](https://github.com/mhart/react-server-routing-example).

实例：
-------

```sh
$ npm install
$ node server.js
```
然后导航到[http://localhost:3000](http://localhost:3000),接着
点击按钮，你可以去查看一些反应事件的动作。

尝试查看页面源，以确保从服务器发送的HTML已经渲染（使用校验和来确定是否需要客户端渲染）这里是相关的的文件内容：

`App.js`:
```js
var React = require('react'),
    DOM = React.DOM, div = DOM.div, button = DOM.button, ul = DOM.ul, li = DOM.li

    //这只是一个可以在前后端上渲染的组件的简单示例
    //服务器和浏览器

module.exports = React.createClass({

  // We initialise its state by using the `props` that were passed in when it
  // was first rendered. We also want the button to be disabled until the
  // component has fully mounted on the DOM
    //我们通过使用传递给它的`props`来初始化它的状态
    //首先被渲染。 我们还希望直到组件已完全挂载在DOM上,按钮一直保持禁用状态，
  getInitialState: function() {
    return {items: this.props.items, disabled: true}
  },

  // Once the component has been mounted, we can enable the button
  //一旦组件已经挂载，我们就可以启用按钮
  componentDidMount: function() {
    this.setState({disabled: false})
  },

  // Then we just update the state whenever its clicked by adding a new item to
  // the list - but you could imagine this being updated with the results of
  // AJAX calls, etc
  //然后我们只是通过添加一个新项目来更新状态列表。 但你可以想象，这是AJAX调用等更新的结果
  handleClick: function() {
    this.setState({
      items: this.state.items.concat('Item ' + this.state.items.length)
    })
  },

  // For ease of illustration, we just use the React JS methods directly
  // (no JSX compilation needed)
  // Note that we allow the button to be disabled initially, and then enable it
  // when everything has loaded
  //为了便于说明，我们只是直接使用React JS方法（不需要JSX编译）
   //注意，我们允许最初禁用按钮，当一切都已加载，然后启用它

  render: function() {

    return div(null,

      button({onClick: this.handleClick, disabled: this.state.disabled}, 'Add Item'),

      ul({children: this.state.items.map(function(item) {
        return li(null, item)
      })})

    )
  },
})
```

`browser.js`:
```js
var React = require('react'),
    ReactDOM = require('react-dom'),
    // This is our React component, shared by server and browser thanks to browserify
    //这是我们的React组件，由于browserify，服务器和浏览器实现了共享
    App = React.createFactory(require('./App'))

// This script will run in the browser and will render our component using the
// value from APP_PROPS that we generate inline in the page's html on the server.
// If these props match what is used in the server render, React will see that
// it doesn't need to generate any DOM and the page will load faster
//此脚本将在浏览器中运行，并将使用来自APP_PROPS的，由我们在服务器上的网页的html中内联生成的值，渲染我们的组件。
//如果这些props与服务器渲染中使用的props匹配，React就会意识到它不需要生成任何DOM，因此页面将加载的更快。
ReactDOM.render(App(window.APP_PROPS), document.getElementById('content'))
```

`server.js`:
```js
var http = require('http'),
    browserify = require('browserify'),
    literalify = require('literalify'),
    React = require('react'),
    ReactDOMServer = require('react-dom/server'),
    DOM = React.DOM, body = DOM.body, div = DOM.div, script = DOM.script,
//这是我们的React组件，由于browserify，服务器和浏览器实现了共享
    App = React.createFactory(require('./App'))


// Just create a plain old HTTP server that responds to two endpoints ('/' and
// '/bundle.js') This would obviously work similarly with any higher level
// library (Express, etc)

//只需创建一个纯粹的HTTP服务器，响应两个端口（'/'和'/bundle.js'）这显然会与任何更高级别类似地库搭配（Express，etc）
http.createServer(function(req, res) {

  // If we hit the homepage, then we want to serve up some HTML - including the
  // server-side rendered React component(s), as well as the script tags
  // pointing to the client-side code
  //如果我们点击首页，那么我们要提供一些HTML- 包括
   //服务器端渲染的React组件，以及指向客户端代码的脚本标签
  if (req.url == '/') {

    res.setHeader('Content-Type', 'text/html; charset=utf-8')

    // `props` represents the data to be passed in to the React component for
    // rendering - just as you would pass data, or expose variables in
    // templates such as Jade or Handlebars.  We just use some dummy data
    // here (with some potentially dangerous values for testing), but you could
    // imagine this would be objects typically fetched async from a DB,
    // filesystem or API, depending on the logged-in user, etc.
    //`props`表示要传递给React组件的数据
     // rendering - 就像你传递数据，或暴露在模板中的变量一样，如Jade或Handlebars。 这里，我们只是使用一些虚拟数（有一些用于测试的，具有潜在问题的值），但你可以想象这是通常从数据库，文件系统，或API中获取的异步的对象，具体取决于登录的用户等。
    var props = {
      items: [
        'Item 0',
        'Item 1',
        'Item </scRIpt>\u2028',
        'Item <!--inject!-->\u2029',
      ]
    }

    // Here we're using React to render the outer body, so we just use the
    // simpler renderToStaticMarkup function, but you could use any templating
    // language (or just a string) for the outer page template
    //这里我们使用React来渲染外输出的body，所以我们只使用简单的renderToStaticMarkup函数，但你可以使用任何输界面的模板语言（或只是一个字符串）。
    var html = ReactDOMServer.renderToStaticMarkup(body(null,

      // The actual server-side rendering of our component occurs here, and we
      // pass our data in as `props`. This div is the same one that the client
      // will "render" into on the browser from browser.js

      //我们的组件的实际服务器端渲染出现在这里，我们将我们的数据作为`props`传递。 这个div和客户端是一样的,将通过browser.js在浏览器上“渲染”
      div({id: 'content', dangerouslySetInnerHTML: {__html:
        ReactDOMServer.renderToString(App(props))
      }}),

      // The props should match on the client and server, so we stringify them
      // on the page to be available for access by the code run in browser.js
      // You could use any var name here as long as it's unique
      //props应该在客户端和服务器上匹配，所以我们对它们进行字符串化
       //方便在页面上可以通过browser.js中运行的代码访问
       //你可以在这里使用任何var名称，只要它是唯一的
      script({dangerouslySetInnerHTML: {__html:
        'var APP_PROPS = ' + safeStringify(props) + ';'
      }}),

      // We'll load React from a CDN - you don't have to do this,
      // you can bundle it up or serve it locally if you like
      //我们将从CDN加载React - 你不必这样做，
       //如果你喜欢，您可以将其捆绑或通过本地提供。
      script({src: '//cdnjs.cloudflare.com/ajax/libs/react/15.4.2/react.min.js'}),
      script({src: '//cdnjs.cloudflare.com/ajax/libs/react/15.4.2/react-dom.min.js'}),

      // Then the browser will fetch and run the browserified bundle consisting
      // of browser.js and all its dependencies.
      // We serve this from the endpoint a few lines down.
      //然后浏览器将获取并运行由browser.js及其所有依赖项组成的browserified bundle。
      //我们从服务的最后阶段算起。
      script({src: '/bundle.js'})
    ))

    // Return the page to the browser
    //返回界面给浏览器
    res.end(html)

  // This endpoint is hit when the browser is requesting bundle.js from the page above
  //当浏览器从上面的页面请求bundle.js时，此终结点被命中
  } else if (req.url == '/bundle.js') {

    res.setHeader('Content-Type', 'text/javascript')

    // Here we invoke browserify to package up browser.js and everything it requires.
    // DON'T do it on the fly like this in production - it's very costly -
    // either compile the bundle ahead of time, or use some smarter middleware
    // (eg browserify-middleware).
    // We also use literalify to transform our `require` statements for React
    // so that it uses the global variable (from the CDN JS file) instead of
    // bundling it up with everything else
    这里我们调用browserify打包browser.js和它需要的一切。
      不要在生产环境中这样做 ，这将非常耗费资源 。
    提前编译bundle或使用一些更智能的中间件例如，browserify中间件）。
      我们还使用literalify来为React转换我们的`require`语句，
      因为它是全局变量（从CDN JS文件）而不是与其他的任何东西绑定。
    browserify()
      .add('./browser.js')
      .transform(literalify.configure({
        'react': 'window.React',
        'react-dom': 'window.ReactDOM',
      }))
      .bundle()
      .pipe(res)

  // Return 404 for all other requests
  // 对于任何其他请求，返回404
  } else {
    res.statusCode = 404
    res.end()
  }

// The http server listens on port 3000
// 监听端口为3000
}).listen(3000, function(err) {
  if (err) throw err
  console.log('Listening on 3000...')
})


// A utility function to safely escape JSON for embedding in a <script> tag
//一个实用函数，用于安全地转义JSON以嵌入<script>标记中
function safeStringify(obj) {
  return JSON.stringify(obj)
    .replace(/<\/(script)/ig, '<\\/$1')
    .replace(/<!--/g, '<\\!--')
    .replace(/\u2028/g, '\\u2028') // Only necessary if interpreting as JS, which we do
    .replace(/\u2029/g, '\\u2029') // Ditto
}
```
