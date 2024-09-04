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

    // extracting attr data
    let parts = attr.split(':')
    let divClasses = parts[4]
    let fileInput = document.querySelector(parts[0])
    let photoContainer = document.querySelector(parts[1])
    let imgWidth = parts[3]
    let undoIcon = document.querySelector(parts[2])

    // classes are optional, all other inputs are not
    if (divClasses) {
        divClasses = divClasses.split(' ')
    }

    // used to update the fileInputs files by extracting from elements in photo container
    function updateFiles(fileInput, photoContainer) {
        let updatedFiles = new DataTransfer()
        let allDivs = photoContainer.querySelectorAll('div')
        for (let i = 0; i < allDivs.length; i++) {
            let currentDiv = allDivs[i]
            updatedFiles.items.add(currentDiv.file)
        }
        fileInput.files = updatedFiles.files  
    }

    // event handler for removing a file
    undoIcon.addEventListener('click', () => {
        let photoContainerElements = photoContainer.children
        if (photoContainerElements.length == 0) {
            return
        }
        photoContainerElements[photoContainerElements.length-1].remove()
        updateFiles(fileInput, photoContainer)
    })
    
    // event handler for uploading a new file
    fileInput.addEventListener('change', (e) => {
        e.preventDefault()
        for (let i = 0; i < fileInput.files.length; i++) {
            let reader = new FileReader()
            let file = fileInput.files[i]
            reader.onload = function(event) {

                let img = new Image()
                img.onload = function() {

                    // getting our elements and context
                    let div = document.createElement('div')
                    let canvas = document.createElement('canvas')
                    let ctx = canvas.getContext('2d')

                    // adding classes to the div
                    for (let i = 0; i < divClasses.length; i++) { div.classList.add(divClasses[i]) }

                    // sizing up our image and canvas
                    let imgHeight = (img.height / img.width) * imgWidth
                    canvas.height = imgHeight
                    canvas.width = imgWidth

                    // drawing on our canvas and inserting in the DOM
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                    div.appendChild(canvas)
                    photoContainer.appendChild(div)
                    div.file = file

                    // updating files
                    updateFiles(fileInput, photoContainer)


                }
                img.src = event.target.result
            }
            reader.readAsDataURL(file)
        }
    })

})


htpl.add('ht-form-file-limit', (element, attr) => {

    let parts = attr.split(':');
    let input = document.querySelector(parts[0]);
    let err = document.querySelector(parts[1]);
    let maxSize = parseFloat(parts[2])

    element.addEventListener('submit', (e) => {
        let files = input.files;
        let size = 0;
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            size += file.size; 
        }
        let sizeInMB = size / (1024 * 1024); 
        if (sizeInMB > maxSize) {
            e.preventDefault(); 
            err.textContent = `exceeded max upload size of ${maxSize} MB`;
        } else {
            err.textContent = ''; 
        }
    });
});


window.addEventListener('DOMContentLoaded', () => {
    htpl.hook()
})