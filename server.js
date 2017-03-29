var http = require('http'),
    browserify = require('browserify'),
    literalify = require('literalify'),
    React = require('react'),
    ReactDOMServer = require('react-dom/server'),
    DOM = React.DOM, body = DOM.body, div = DOM.div, script = DOM.script, link = DOM.link,
    // This is our React component, shared by server and browser thanks to browserify
    App = React.createFactory(require('./App'));
http.createServer(function (req, res) {
    if (req.url == '/') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        var props = {
            items: [
                'Item 0',
                'Item 1',
                'Item </scRIpt>\u2028',
                'Item <!--inject!-->\u2029',
            ],
            defaultButton: 'mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-button--accent'
        };
        var html = ReactDOMServer.renderToStaticMarkup(body(null,
            div({
                id: 'content', dangerouslySetInnerHTML: {
                    __html: ReactDOMServer.renderToString(App(props))
                }
            }),
            script({
                dangerouslySetInnerHTML: {
                    __html: 'var APP_PROPS = ' + safeStringify(props) + ';'
                }
            }),
            script({src: '//cdnjs.cloudflare.com/ajax/libs/react/15.4.2/react.min.js'}),
            script({src: '//cdnjs.cloudflare.com/ajax/libs/react/15.4.2/react-dom.min.js'}),
            link({href: 'https://fonts.googleapis.com/icon?family=Material+Icons',rel:'stylesheet'}),
            link({href: 'https://code.getmdl.io/1.3.0/material.indigo-pink.min.css',rel:'stylesheet'}),
            script({src: '/bundle.js'})
        ));
        res.end(html)

    } else if (req.url == '/bundle.js') {

        res.setHeader('Content-Type', 'text/javascript');
        browserify()
            .add('./browser.js')
            .transform(literalify.configure({
                'react': 'window.React',
                'react-dom': 'window.ReactDOM',
            }))
            .bundle()
            .pipe(res)
    } else {
        res.statusCode = 404;
        res.end()
    }
}).listen(3000, function (err) {
    if (err) throw err;
    console.log('Listening on 3000...')
});

function safeStringify(obj) {
    return JSON.stringify(obj)
        .replace(/<\/(script)/ig, '<\\/$1')
        .replace(/<!--/g, '<\\!--')
        .replace(/\u2028/g, '\\u2028') // Only necessary if interpreting as JS, which we do
        .replace(/\u2029/g, '\\u2029') // Ditto
}
