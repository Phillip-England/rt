class Rat {

    constructor() {
        this.routes = {}
        this.prefixGroups = {}
    }

    at(path, handler, ...middleware) {
        middleware.push(...this.prefixGroups['GLOBAL'])
        for (const key in this.prefixGroups) {
            if (key == "/" && path.count('/') == 1 && path[0] == '/') {
                middleware.push(...this.prefixGroups[key])
                break
            }
            if (path.startsWith(key) && key != "/") {
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
        if (pathPrefix == "*") {
            pathPrefix = "GLOBAL"
        }
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

const rat = new Rat();