package main

import (
	"html/template"
	"net/http"

	"github.com/Phillip-England/vbf"
)

const KEY_TEMPLATES = "TEMPLATES"

func main() {

	mux, g := vbf.VeryBestFramework()

	t, err := vbf.ParseTemplates("./templates")
	if err != nil {
		panic(err)
	}

	vbf.SetGlobalContext(g, KEY_TEMPLATES, t)

	vbf.AddRoute("GET /", mux, g, func(w http.ResponseWriter, r *http.Request) {
		t, _ := vbf.GetContext(KEY_TEMPLATES, r).(*template.Template)
		vbf.ExecuteTemplate(w, t, "layout.html", map[string]interface{}{
			"Title":      "Receipt Tracker",
			"HeaderText": "Receipt Tracker",
			"SubText":    "where's my money?",
		})
	}, vbf.MwLogger)

	err = vbf.Serve(mux, "8080")
	if err != nil {
		panic(err)
	}

}
