package main

import (
	"net/http"

	g "github.com/Phillip-England/gsc"
	"github.com/Phillip-England/vbf"
)

func IconBars() g.Component {
	return g.Svg().Aria("hidden", "true").Xmlns("http://www.w3.org/2000/svg").Height("24").Width("24").Fill("none").ViewBox("0 0 24 24").In(
		g.Path().Stroke("currentColor").StrokeLineCap("round").StrokeWidth("2").D("M5 7h14M5 12h14M5 17h14"),
	)
}

func IconX() g.Component {
	return g.Svg().Aria("hidden", "true").Xmlns("http://www.w3.org/2000/svg").Height("24").Width("24").Fill("none").ViewBox("0 0 24 24").In(
		g.Path().Stroke("currentColor").StrokeLineCap("round").StrokeLineJoin("round").StrokeWidth("2").D("M6 18L17.94 6M18 18L6.06 6"),
	)
}

func FormTextInput(label string, name string) g.Component {
	return g.Div().Class("flex flex-col gap-2").In(
		g.Label().Class("text-sm").Text(label),
		g.Input().Class("border rounded outline-none text-sm px-2 py-1 focus:border-gray-500").Type("text").Name(name),
	)
}

func FormTextArea(label string, name string) g.Component {
	return g.Div().Class("flex flex-col gap-2").In(
		g.Label().Class("text-sm").Text(label),
		g.Textarea().Class("border rounded outline-none text-sm px-2 py-1 focus:border-gray-500").Attr("rows", "4").Name(name),
	)
}

func FormTitle(text string) g.Component {
	return g.H2().Class("text-xl font-bold").Text(text)
}

func Layout(isOpen bool) g.Component {
	return g.HTMLDoc().In(
		g.Head().In(
			g.Meta().Name("viewport").Content("width=device-width, initial-scale=1.0"),
			g.Link().Rel("stylesheet").Href("/static/css/output.css"),
			g.Script().Src("/static/js/index.js"),
			g.Script().Src("https://unpkg.com/htmx.org@2.0.2"),
			g.Title().Text("Receipt Tracker"),
		),
		g.Body().Attr("hx-boost", "true").In(
			g.Div().Class("grid grid-cols-8").In(
				g.Header().Class("border-b h-[85px] p-4 flex flex-row justify-between items-center col-span-8 z-40 bg-white").In(
					g.Div().Class("flex flex-col gap-1").In(
						g.H1().Class("text-xl font-bold").Text("Receipt Tracker"),
						g.P().Class("text-sm").Text("Where's my money?"),
					),
					g.Div().Class("flex items-center").In(
						g.IfElse(isOpen,
							g.A().Href("/").In(
								IconX(),
							),
							g.A().Href(`/?open=true`).In(
								IconBars(),
							),
						),
					),
				),
				g.Main().Class("col-start-1 col-end-9 p-2").In(
					g.Form().Attr("action", "/").Attr("scan", "#upload-button #hidden-button #photo-container").ID("receipt-form").Class("p-4 rounded flex flex-col gap-8").In(
						FormTitle("Upload Receipts"),
						FormTextInput("Name", "name"),
						FormTextArea("What are these expenses for?", "reason"),
						g.Input().Type("button").ID("upload-button").Class("bg-blue-700 text-white rounded w-fit text-sm py-1 px-4").Value("select file"),
						g.Input().Type("file").Class("hidden").ID("hidden-button").Name("file"),
						g.Button().Class("bg-black py-2 px-4 rounded text-white text-sm").Text("Submit"),
						g.Div().Class("flex flex-wrap gap-8").ID("photo-container"),
					),
				),
				g.If(isOpen,
					g.A().Href("/").In(
						g.Div().Class("absolute top-0 h-full w-full bg-black z-30 opacity-50"),
					),
				),
				g.If(isOpen,
					g.Nav().Class("absolute w-4/5 border-r h-full z-30 bg-white").In(
						g.Div().Class("h-[85px]"),
						g.Ul().Class("flex flex-col gap-2 p-2 w-full text-sm").In(
							g.Li().Class("flex").In(
								g.A().Class("p-4 w-full border rounded").Href("/").Text("Home"),
							),
							g.Li().Class("flex").In(
								g.A().Class("p-4 w-full border rounded").Href("/about").Text("About"),
							),
						),
					),
				),
			),
		),
	)
}

func main() {

	mux, gCtx := vbf.VeryBestFramework()

	vbf.AddRoute("GET /", mux, gCtx, func(w http.ResponseWriter, r *http.Request) {
		vbf.WriteHTML(w, Layout(vbf.ParamIs(r, "open", "true")).ToString())
	}, vbf.MwLogger)

	err := vbf.Serve(mux, "8080")
	if err != nil {
		panic(err)
	}

}
