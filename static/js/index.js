
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

    selectorToName(selector, removePrefix=false) {
        let chars = selector.split('');
        for (let i = 0; i < chars.length; i++) {
            let char = chars[i];
            if (char === '-') {
                chars[i + 1] = chars[i + 1].toUpperCase();
                chars.splice(i, 1);
            }
        }
        if (removePrefix) {
            if (chars[0] === '#' || chars[0] === '.') {
                chars.splice(0, 1);
            }
        }
        return chars.join('');
    }
    
    scan(selector, rootName = "root") {
        let element = this.qs(selector);
        let scan = element.getAttribute('scan');
        if (!scan || scan === "") {
            console.error(`Element with selector ${selector} does not have a scan attribute scan=''`);
            return;
        }
        let scanSplit = scan.split(' ');
        let elements = {};
        for (let i = 0; i < scanSplit.length; i++) {
            let scanSelector = scanSplit[i];
            let scanElement = this.qs(scanSelector, element);
            let scanName = this.selectorToName(scanSelector, true);
            elements[scanName] = scanElement;
        }
        elements[rootName] = element;
        return elements;
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

    arrayForEach(array, callback) {
        for (let i = 0; i < array.length; i++) {
            callback(array[i])
        }
    }

    formInputs(form) {
        let inputs = this.qsa('[name]', form)
        let output = {}
        this.arrayForEach(inputs, (input) => {
            let name = input.getAttribute('name')
            let jsName = this.selectorToName(name)
            output[jsName] = input
        })
        return output
    }

    formValues(form) {
        let inputs = this.qsa('[name]', form)
        let output = {}
        this.arrayForEach(inputs, (input) => {
            let name = input.getAttribute('name')
            let jsName = this.selectorToName(name)
            output[jsName] = input.value
        })
        return output
    }

    fileInputOnChange(fileInput, onChange) {
        fileInput.addEventListener('change', (e) => {
            let input = e.target
            let file = input.files[0]
            let canvas = document.createElement('canvas')
            canvas.classList.add('flex')
            let reader = new FileReader()
            reader.onload = function(readerEvent) {
                const img = new Image()
                let ctx = canvas.getContext('2d')
                img.onload = function() {
                    onChange(e, canvas, ctx, img, file)
                }
                img.src = readerEvent.target.result
            }
            reader.readAsDataURL(file)
        })
    }

}



class Xerus {

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



app.use("GLOBAL")

app.at("/", () => {

    let {form, uploadButton, hiddenButton} = lib.scan("#receipt-form", "form")
    let photoContainer = lib.qs('#photo-container')

    uploadButton.addEventListener('click', () => {
        hiddenButton.click()
    })

    let files = []
    let fileData = new DataTransfer()

    lib.fileInputOnChange(hiddenButton, (e, canvas, ctx, img, file) => {
        canvas.height = img.height
        canvas.width = img.width
        ctx.drawImage(img, 0, 0)
        let div = document.createElement('div')
        div.setAttribute('key', files.length)
        div.classList.add('flex', 'object-fit', 'overflow-x-scroll', 'h-fit', 'relative')
        let close = document.createElement('div')
        close.classList.add('left-0', 'top-0', 'absolute',  'z-40', 'cursor-pointer', 'p-2')
        close.innerHTML = `
            <svg class="w-16 h-16 text-white bg-black rounded-full" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
            </svg>

        `
        div.appendChild(close)
        div.appendChild(canvas)
        files.push({
            'key': files.length,
            'file': file
        })
        fileData.items.add(file)
        hiddenButton.value = ''
        div.addEventListener('click', (e) => {
            div.remove()
            let key = div.getAttribute('key')
            for (let i = 0; i < files.length; i++) {
                let f = files[i]
                if (f.key == key) {
                    files.splice(i, 1)
                }
            }
        })
        photoContainer.appendChild(div)
        hiddenButton.files = fileData.files
    })

    // hiddenButton.addEventListener('change', (e) => {
    //     let { reason, name, file } = lib.formInputs(form)
    //     let photo = file.files[0]
    //     let canvas = document.createElement('canvas')
    //     form.appendChild(canvas)
    //     let reader = new FileReader()
    //     reader.onload = function(event) {
    //         const img = new Image()
    //         img.onload = function() {
    //             let ctx = canvas.getContext('2d')
    //             img.width = canvas.width
    //             img.height = canvas.height
    //             ctx.drawImage(img, 0, 0)
    //         }
    //         img.src = event.target.result
    //     }
    //     reader.readAsDataURL(photo)
    // })
})



app.at("/about", () => {})




