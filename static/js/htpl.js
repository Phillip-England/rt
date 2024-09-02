class Htpl {

    constructor() {
        this.attributes = {}
    }

    
    add(attribute, fn) {
        this.attributes[attribute] = fn
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