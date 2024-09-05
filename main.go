package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	g "github.com/Phillip-England/gsc"
	"github.com/Phillip-England/vbf"
	"gopkg.in/gomail.v2"
)

//=================================
// COMPONENTS
//=================================

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

func IconUndo() g.Component {
	return g.Svg().Aria("hidden", "true").Xmlns("http://www.w3.org/2000/svg").Height("24").Width("24").Fill("none").ViewBox("0 0 24 24").In(
		g.Path().Stroke("currentColor").StrokeLineCap("round").StrokeLineJoin("round").StrokeWidth("2").D("M3 9h13a5 5 0 0 1 0 10H7M3 9l4-4M3 9l4 4"),
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

//=================================
// SHARED BEHAVIOR / EVENTS
//=================================

func ToggleNav(c g.Component) g.Component {
	return c.Attr("ht-mass-toggle", "click:#header-bars #header-x #nav-overlay #nav-menu:hidden")
}

//=================================
// LAYOUTS
//=================================

func Layout(isOpen bool) g.Component {
	return g.HTMLDoc().In(
		g.Head().In(
			g.Meta().Name("viewport").Content("width=device-width, initial-scale=1.0"),
			g.Link().Rel("stylesheet").Href("/static/css/output.css"),
			g.Script().Src("/static/js/rat.js"),
			g.Script().Src("/static/js/htpl.js"),
			g.Title().Text("Receipt Tracker"),
		),
		g.Body().Attr("hx-boost", "true").In(
			g.Div().Class("flex flex-col").In(
				g.Header().Class("border-b h-[85px] p-4 flex flex-row justify-between items-center col-span-8 z-40 bg-white").In(
					g.Div().Class("flex flex-col gap-1").In(
						g.H1().Class("text-xl font-bold").Text("Receipt Tracker"),
						g.P().Class("text-sm").Text("Where's my money?"),
					),
					g.Div().Of(ToggleNav).Class("flex items-center cursor-pointer").In(
						IconBars().ID("header-bars"),
						IconX().ID("header-x").Class("hidden"),
					),
				),
				g.Main().Class("flex flex-col items-center").In(
					g.Form().Attr("ht-form-file-limit", "#hidden-file-input:#form-err:50").Attr("ht-multi-photo-form", "#hidden-file-input:#photo-container:#photo-undo:200:cursor-pointer flex").Attr("enctype", "multipart/form-data").Attr("method", "POST").Attr("action", "/").Attr("scan", "#upload-button #hidden-button").ID("receipt-form").Class("rounded flex flex-col w-full gap-8 p-4").In(
						FormTitle("Upload Receipts"),
						g.P().ID("form-err").Class("text-red-500 text-sm"),
						FormTextInput("Name", "name"),
						FormTextArea("What are these expenses for?", "reason"),
						g.Div().Class("flex flex-row justify-between").In(
							g.Input().Attr("ht-click-proxy", "#hidden-file-input").Type("button").ID("upload-button").Class("bg-blue-700 cursor-pointer text-white rounded w-fit text-sm py-1 px-4").Value("select file"),
							g.Div().ID("photo-undo").Class("flex items-center pr-4 cursor-pointer").In(
								IconUndo(),
							),
						),
						g.Input().Type("file").Class("hidden").ID("hidden-file-input").Name("file").Attr("multiple", ""),
						g.Button().Class("bg-black py-2 px-4 rounded text-white text-sm").Text("Submit"),
					),
					g.Div().Class("flex flex-wrap flex-start p-4 w-full overflow-hidden gap-4 items-start").ID("photo-container"),
				),
				g.Div().Of(ToggleNav).ID("nav-overlay").Class("absolute top-0 h-full w-full bg-black z-30 opacity-50 hidden"),
				g.Nav().ID("nav-menu").Class("absolute w-4/5 border-r h-full z-30 bg-white hidden").In(
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
	)
}

func main() {

	mux, gCtx := vbf.VeryBestFramework()

	// _ = godotenv.Load()

	vbf.AddRoute("GET /", mux, gCtx, func(w http.ResponseWriter, r *http.Request) {
		vbf.WriteHTML(w, Layout(vbf.ParamIs(r, "open", "true")).ToString())
	}, vbf.MwLogger)

	vbf.AddRoute("POST /", mux, gCtx, func(w http.ResponseWriter, r *http.Request) {
		err := r.ParseMultipartForm(10 << 20)
		if err != nil {
			fmt.Println(err)
			http.Error(w, "Unable to parse form", http.StatusBadRequest)
			return
		}

		files := r.MultipartForm.File["file"]
		if len(files) == 0 {
			http.Error(w, "No files uploaded", http.StatusBadRequest)
			return
		}

		from := os.Getenv("EMAIL")
		password := os.Getenv("EMAIL_PASSWORD")
		to := os.Getenv("EMAIL_TO")

		// Email subject and body
		subject := "Files Uploaded"
		body := "Hello, attached are the files you uploaded."

		// Set up the email message
		m := gomail.NewMessage()
		m.SetHeader("From", from)
		m.SetHeader("To", to)
		m.SetHeader("Subject", subject)
		m.SetBody("text/plain", body)

		// Attach each file to the email
		for _, fileHeader := range files {
			file, err := fileHeader.Open()
			if err != nil {
				fmt.Println(err)
				http.Error(w, "Unable to open the file", http.StatusBadRequest)
				return
			}
			defer file.Close()

			fmt.Printf("Received file: %s (%d bytes)\n", fileHeader.Filename, fileHeader.Size)

			// Attach the file to the email
			m.Attach(fileHeader.Filename, gomail.SetCopyFunc(func(w io.Writer) error {
				_, err := io.Copy(w, file)
				return err
			}))
		}

		// Set up the SMTP dialer
		d := gomail.NewDialer(os.Getenv("EMAIL_HOST"), 587, from, password)

		// Send the email
		if err := d.DialAndSend(m); err != nil {
			log.Fatalf("Could not send email: %v", err)
		}

		log.Println("Email sent successfully!")
		// Redirect or respond as needed
		w.Header().Set("location", "/")
		w.WriteHeader(303)
	})

	err := vbf.Serve(mux, "8080")
	if err != nil {
		panic(err)
	}

}
