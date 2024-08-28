
class Primitive {

    constructor() {
        this.routes = {}
        this.events = {}
    }

    signal(initialValue) {
        let value = initialValue;
        let subscribers = [];
    
        function get() {
            return value;
        }
    
        function set(newValue) {
            if (value !== newValue) {
            value = newValue;
            subscribers.forEach(callback => callback(value));
            }
        }
    
        function subscribe(callback) {
            subscribers.push(callback);
            return () => {
            subscribers = subscribers.filter(sub => sub !== callback);
            };
        }
    
        return { get, set, subscribe };
    
    }

    qs(selector, node=null) {
        if (node) {
            return node.querySelector(selector)
        } else {
            return document.querySelector(selector)
        }
    }
    
    qsa(selector, node=null) {
        if (node) {
            return node.querySelectorAll(selector)
        } else {
            return document.querySelectorAll(selector)
        }
    }

    getRouter() {
        return {}
    }
    
    addRoute(path, handler, ...middleware) {
        this.routes[path] = () => {
            for (let i = 0; i < middleware.length; i ++) {
                handler = middleware[i](handler)
            }
            handler()
        }
    }

    executeRoute() {
        let currentPath = window.location.pathname
        let route = this.routes[currentPath]
        if (!route) {
            console.error(`router does not contain a handler for path: ${currentPath}`)
        }
        route()
    }

    serviceLogger(next) {
        return () => {
            console.log('logger before')
            next()
            console.log('logger after')
        }
    }

    createService(name, func) {
        this.events[name] = func 
    }

    getService(name) {
        let service = this.events[name]
        if (!service) {
            console.error(`service with name of ${name} does not exist`)
        }
        return service
    }

}

let $ = new Primitive();

$.createService("toggleNav", (next) => {
    return () => {
        let root = $.qs("#root")
        let header = $.qs('header', root)
        console.log(header)
        next()
    }
})

$.addRoute("/", () => {
    console.log('/')
}, $.serviceLogger, $.getService('toggleNav'))

// todo - how to handle paths that are dynamic /user/{id}




