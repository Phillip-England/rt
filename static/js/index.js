
class XerusLib {

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
            let elm = node.querySelector(selector)
            if (!elm) {
                console.error(`could not locate element for selector ${selector}`)
            }
            return elm
        } else {
            let elm = document.querySelector(selector)
            if (!elm) {
                console.error(`could not locate element for selector ${selector}`)
            }
            return elm
        }
    }

    qsa(selector, node=null) {
        if (node) {
            let elm = node.querySelectorAll(selector)
            if (!elm) {
                console.error(`could not locate element for selector ${selector}`)
            }
            return elm
        } else {
            let elm = document.querySelectorAll(selector)
            if (!elm) {
                console.error(`could not locate element for selector ${selector}`)
            }
            return elm
        }
    }

    scan(selector) {
        let element = this.qs(selector)
        let scan = element.getAttribute('scan')
        if (!scan || scan == "") {
            console.error(`element with selector ${selector} does not hav a scan attribtue scan=''`)
        }
        let scanSplit = scan.split(' ')
        let elements = {}
        for (let i = 0; i < scanSplit.length; i++) {
            let scanSelector = scanSplit[i]
            let scanElement = this.qs(scanSelector, element)
            let scanChars = scanSelector.split('')
            for (let i2 = 0; i2 < scanChars.length; i2++) {
                let char = scanChars[i2]
                if (char == "-") {
                    scanChars[i2+1] = scanChars[i2+1].toUpperCase()
                    scanChars.splice(i2, 1)
                }
            }
            if (scanChars[0] == "#" || scanChars[0] == ".") {
                scanChars.splice(0, 1)
            }
            let scanName = scanChars.join('')
            elements[scanName] = scanElement
        }
        elements.root = element
        return elements
    }

    massToggle(classes, ...elements) {
        for (let i = 0; i < classes.length; i++) {
            let cls = classes[i]
            for (let i2 = 0; i2 < elements.length; i2++) {
                let elm = elements[i2]
                elm.classList.toggle(cls)
            }
        }
    }

    massEvents(eventType, event, ...elements) {
        for (let i = 0; i < elements.length; i++) {
            let elm = elements[i]
            elm.addEventListener(eventType, event)
        }
    }

}



class Xerus {

    constructor() {
        this.routes = {}
        this.prefixGroups = {}
    }

    at(path, handler, ...middleware) {
        for (const key in this.prefixGroups) {
            if (path.startsWith(key)) {
                middleware.push(...this.prefixGroups[key])
                break
            }
        }
        this.routes[path] = () => {
            for (let i = 0; i < middleware.length; i ++) {
                handler = middleware[i](handler)
            }
            handler()
        }
    }


    use(pathPrefix, ...middleware) {
        this.prefixGroups[pathPrefix] = middleware
    }

    run() {
        let currentPath = window.location.pathname
        let route = this.routes[currentPath]
        if (!route) {
            let potentialDynamicPath = this.searchObjectForDynamicPath(this.routes)
            route = this.routes[potentialDynamicPath]
            if (!route) {
                console.error(`router does not contain a handler for path: ${currentPath}`)
                return
            }
        }
        route()
    }

    searchObjectForDynamicPath(obj) {
        let currentPath = window.location.pathname
        for (const key in obj) {
            if (!key.includes("{") && !key.includes("}")) {
                continue
            }
            let pathParts = currentPath.split("/")
            let keyParts = key.split('/')
            if (pathParts.length != keyParts.length) {
                continue
            }
            let newPathParts = []
            let noBrackets = keyParts.filter((str, i) => {
                if (str.includes("{") && str.includes("}")) {
                    return false
                }
                newPathParts.push(pathParts[i])
                return true
            })
            for (let i=0; i < newPathParts.length; i++) {
                let k = noBrackets[i]
                let p = newPathParts[i]
                if (k != p) {
                    break
                }
                if (i == newPathParts.length -1) {
                    return key
                }
            }
        } 
        return ""
    }

}

const app = new Xerus();
const lib = new XerusLib()

function toggleNav(next) {
    return () => {
        let { root, bars, header, main, nav, navOverlay, x } = lib.scan('#grid-one-col')
        lib.massEvents('click', () => {
            lib.massToggle(['hidden'], x, bars, navOverlay, nav)
        }, x, bars, navOverlay)
        next() 
    }
} 

app.use("/", toggleNav)

app.at("/", () => {})
app.at("/about", () => {})



