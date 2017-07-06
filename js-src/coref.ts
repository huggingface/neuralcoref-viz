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

declare interface SpansEmbeddings {
	Doc: string;
	Mention: string[];
	MentionLeft: string[];
	MentionRight: string[];
	Sentence: string[];
}

declare interface WordsEmbeddings {
	MentionFirstWord: string;
	MentionHead: string;
	MentionLastWord: string;
	MentionRootHead: string;
	NextWord: string;
	PreviousWord: string;
	SecondNextWord: string;
	SecondPreviousWord: string;
}

declare interface MentionFeatures {
	MentionLength: number;
	MentionNormLocation: number;
	MentionType: string;
	IsMentionNested: number;
	DocGenre?:	string | null;
}

declare interface MentionsPairFeatures {
	SameSpeaker: number;
	AntMatchMentionSpeaker: number;
	MentionMatchSpeaker: number;
	HeadsAgree: number;
	ExactStringMatch: number;
	RelaxedStringMatch: number;
	SentenceDistance: number;
	MentionDistance: number;
	Overlapping: number;
	M1Features: MentionFeatures;
	M2Features: MentionFeatures;
	DocGenre: string | null;
}

declare interface SingleFeatures {
	features: MentionFeatures;
	spansEmbeddings: SpansEmbeddings;
	wordsEmbeddings: WordsEmbeddings;
}

declare interface PairFeatures {
	pairFeatures: MentionsPairFeatures;
	antecedentSpansEmbeddings: SpansEmbeddings;
	antecedentWordsEmbeddings: WordsEmbeddings;
	mentionSpansEmbeddings: SpansEmbeddings;
	mentionWordsEmbeddings: WordsEmbeddings;
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
	singleFeatures: { [id: number]: SingleFeatures | null };
	pairFeatures: { [id: number]: { [id: number]: PairFeatures } };
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
				console.log(res)
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
		this.svgContainer.textContent = "";  // Empty
		this.svgResize();
		(<any>window).container = this.container;
		(<any>window).svgContainer = this.svgContainer;
		/**
		 * Arrows preparation
		 */
		const endY = document.querySelector('.container .text')!.getBoundingClientRect().top 
			- this.container.getBoundingClientRect().top
			- 2;
		SvgArrow.yArrows = endY;
		/**
		 * Render arrows
		 */
		for (const [__from, scores] of Object.entries(res.pairScores)) {
			const from = parseInt(__from, 10);   /// Convert all string keys to ints...
			for (const [__to, score] of Object.entries(scores)) {
				const to = parseInt(__to, 10);
				
				// Positions:
				const markFrom = document.querySelector(`mark[data-index="${from}"]`) as HTMLElement;
				const markTo   = document.querySelector(`mark[data-index="${to}"]`) as HTMLElement;
				// console.log(markFrom, markTo, score);  // todo remove
				const arrow = new SvgArrow(this.container, markFrom, markTo, score);
				// Is this a resolved coref?
				if (score >= Math.max(...Object.values(scores))) {
					arrow.classNames.push('score-ok');  // Best pairwise score
					// Is it the better than the singleScore?
					const singleScore = res.singleScores[from];
					if (singleScore && score >= singleScore) {
						arrow.classNames.push('score-best');
					}
				}
				
				this.svgContainer.appendChild(arrow.generate());
			}
		}
	}
}
