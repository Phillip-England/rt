class Htpl {

    constructor() {
        this.attributes = {}
        this.ctx = {}
    }

    
    add(attribute, fn) {
        this.attributes[attribute] = fn
    }

    stamp(element) {
        element.setAttribute('ht-stamp', 'true')
    }

    hook() {
        for (let i = 0; i < Object.keys(this.attributes).length; i++) {
            let key = Object.keys(this.attributes)[i]
            let allElements = document.querySelectorAll('*')
            for (let i2 = 0; i2 < allElements.length; i2++) {
                let element = allElements[i2]
                let attributes = element.attributes
                for (const attrKey in attributes) {
                    let attr = attributes[attrKey].name
                    if (typeof(attr) == 'string') {
                        if (attr.startsWith(key)) {
                            this.attributes[key](element, element.getAttribute(attr))
                        }
                    }
                }
            }
        }
    }
}

const htpl = new Htpl()

htpl.add("ht-click-proxy", (element, attr) => {
    let target = document.querySelector(attr)
    element.addEventListener('click', () => {
        target.click()
    })
})

htpl.add('ht-mass-toggle', (element, attr) => {
    let parts = attr.split(":")
    let eventType = parts[0]
    let targets = parts[1].split(' ')
    let classes = parts[2].split(' ')
    element.addEventListener(eventType, () => {
        for (let i = 0; i < targets.length; i++) {
            let target = document.querySelector(targets[i])
            for (let i2 = 0; i2 < classes.length; i2++) {
                let cls = classes[i2]
                target.classList.toggle(cls)
            }
        }
    })
})

htpl.add('ht-multi-photo-form', (element, attr) => {

    function extract() {
        let parts = attr.split(':')
        if (parts.length < 2) {
            console.error('ht-multi-photo-form does not have enough args')
        }
        let fileInputSelector = parts[0]
        let photoContainerSelector = parts[1]
        let canvasWrapperClasses = []
        if (parts[2]) {
            canvasWrapperClasses = parts[2].split(" ")
        }
        let scaleRatio = 1
        if (parts[3]) {
            scaleRatio = Number(parts[3])
        }
        let fileInput = document.querySelector(fileInputSelector)
        let photoContainer = document.querySelector(photoContainerSelector)
        let data = new DataTransfer()
        return {fileInput, photoContainer, scaleRatio, canvasWrapperClasses, data}
    }

    function getDiv(file, canvasWrapperClasses) {
        let div = document.createElement('div')
        div.setAttribute('key', file.name)
        for (let i = 0; i < canvasWrapperClasses.length; i++) {
            let cls = canvasWrapperClasses[i]
            div.classList.add(cls)
        }
        return div
    }

    function getCanvas(scaleRatio, img) {
        let canvas = document.createElement('canvas')
        canvas.height = img.height * scaleRatio
        canvas.width = img.width * scaleRatio
        return {
            'canvas': canvas,
            'ctx': canvas.getContext('2d')
        }
    }

    function hookDeleteOnDiv(div, fileInput) {
        div.addEventListener('click', () => {
            let newFiles = new DataTransfer()
            let found = false
            for (let i = 0; i < fileInput.files.length; i++) {
                let f = fileInput.files[i]
                if (f.name == div.getAttribute('key') && found == false) {
                    found = true
                    div.remove()
                    continue
                }
                newFiles.items.add(f)
            }
            fileInput.files = newFiles.files
        })
    }

    function draw(canvas, div, photoContainer, ctx, img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        div.appendChild(canvas)
        photoContainer.appendChild(div)
    }

    let {fileInput, photoContainer, scaleRatio, canvasWrapperClasses, data} = extract()

    fileInput.addEventListener('change', (e) => {
        e.preventDefault()

        for (let i = 0; i < fileInput.files.length; i++) {
            let file = fileInput.files[i]
            if (!file) {
                continue
            }
            let reader = new FileReader()
            if (!reader) {
                continue
            }
            reader.onload = function(event) {
                let img = new Image()
                if (!img) {
                    return
                }
                img.onload = function() {
                    data.items.add(file)
                    fileInput.files = data.files
                    let div = getDiv(file, canvasWrapperClasses)
                    hookDeleteOnDiv(div, fileInput)
                    let { canvas, ctx } = getCanvas(scaleRatio, img)
                    draw(canvas, div, photoContainer, ctx, img)
                }
                img.src = event.target.result
            }
            reader.readAsDataURL(file)
        }
    })
})


window.addEventListener('DOMContentLoaded', () => {
    htpl.hook()
})