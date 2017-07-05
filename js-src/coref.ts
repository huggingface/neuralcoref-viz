declare type MentionType= "PRONOMINAL" | "NOMINAL" | "PROPER" | "LIST";

declare interface Mention {
	index: number;
	start: number;
	end:   number;
	utterance:  number;
	type:  MentionType;
	text:  string;
}

declare interface Coreference {
	original: string;
	resolved: string;
}

declare interface Response {
	cleanedText: string;
	corefResText: string;
	coreferences: Coreference[];
	mentions: Mention[];
	singleScores: { [id: number]: number | null };               /// Is this mention likely to be a single mention (w/o any corefs). `id` is a Mention's `index`
	pairScores: { [id: number]: { [id: number]: number } };      /// Pair-wise score, in `{ from: { to: ... } }` format. Non-directed arcs.
	                                                             /// Single scores are to be compared to the set of pairScores (for the same mention).
	                                                             /// If it's higher than every pair score, it's a single mention.
	cleanedContext: string;                                      /// Cleaned version of the context.
	isResolved: boolean;
}

class Coref {
	endpoint: string;
	onStart =   () => {};
	onSuccess = () => {};
	container?: HTMLElement;
	svgContainer?: SVGSVGElement;
	
	constructor(endpoint: string, opts: any) {
		this.endpoint = endpoint;
		if (opts.onStart) {
			(<any>this).onStart   = opts.onStart;
		}
		if (opts.onSuccess) {
			(<any>this).onSuccess = opts.onSuccess;
		}
		
		window.addEventListener('resize', this.svgResize);
	}
	
	svgResize() {
		if (!this.container || !this.svgContainer) { return ; }
		this.svgContainer.setAttribute('width', `${this.container.scrollWidth}`);   /// Caution: not offsetWidth.
		this.svgContainer.setAttribute('height', `${this.container.scrollHeight}`);
	}
	
	parse(text: string) {
		this.onStart();
		
		const path = `${this.endpoint}?text=${encodeURIComponent(text)}`;
		const request = new XMLHttpRequest();
		request.open('GET', path);
		request.onload = () => {
			if (request.status >= 200 && request.status < 400) {
				this.onSuccess();
				const res: Response = JSON.parse(request.responseText);
				this.render(res);
			}
			else {
				console.error('Error', request);
			}
		};
		request.send();
	}
	
	render(res: Response) {
		const mentions = (<any>res).mentions;  // We will sort them in Displacy
		for (const m of mentions) {
			// Let's add each mention's singleScore
			m.singleScore = res.singleScores[m.index] || undefined;
		}
		const markup = Displacy.render(res.cleanedText, mentions);
		if (!this.container || !this.svgContainer) { return ; }
		
		this.container.innerHTML = `<div class="text">${markup}</div>`;
		/// SVG
		this.svgResize();
		// this.svgContainer.width = this.container
		window.container = this.container;
		window.svgContainer = this.svgContainer;
	}
}
