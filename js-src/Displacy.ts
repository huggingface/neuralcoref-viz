

/**
 * Indicates position of spans of text inside the string. 
 * (for visual applications only, no semantic sense here.)
 */
interface Span {
	type:  string;
	start: number;
	end:   number;
}

interface SpanTag {
	span: Span;
	tag: "start" | "end";
}

class Displacy {
	static sortSpans(spans: Span[]) {
		spans.sort((a, b) => {  /// `a` should come first when the result is < 0
			if (a.start === b.start) {
				return b.end - a.end;   /// CAUTION.
			}
			return a.start - b.start;
		});
		
		// Check existence of **strict overlapping**
		spans.forEach((s, i) => {
			if (i < spans.length - 1) {
				const sNext = spans[i+1];
				if (s.start < sNext.start && s.end > sNext.start) {
					console.log("ERROR", "Spans: strict overlapping");
				}
			}
		});
	}
	
	/**
	 * Render a text string and its entity spans
	 * 
	 * *see displacy-ent.js*
	 * see https://github.com/explosion/displacy-ent/issues/2
	 */
	static render(text: string, spans: Span[]): string {
		this.sortSpans(spans);
		
		const tags: { [index: number]: SpanTag[] } = {};
		const __addTag = (i: number, s: Span, tag: "start" | "end") => {
			if (Array.isArray(tags[i])) {
				tags[i].push({ span: s, tag: tag });
			} else {
				tags[i] = [{ span: s, tag: tag }];
			}
		};
		for (const s of spans) {
			__addTag(s.start, s, "start");
			__addTag(s.end, s, "end");
		}
		// console.log(JSON.stringify(tags));  // todo remove
		
		let out = {
			__content: "",
			append(s: string) {
				this.__content += s;
			}
		};
		let offset = 0;
		
		const indexes = Object.keys(tags).map(k => parseInt(k, 10)).sort((a, b) => a - b); /// CAUTION
		for (const i of indexes) {
			const spanTags = tags[i];
			// console.log(i, spanTags);  // todo remove
			if (i > offset) {
				out.append(text.slice(offset, i));
			}
			
			offset = i;
			
			for (const sT of spanTags) {
				if (sT.tag === "start") {
					out.append(`<mark data-entity="${ sT.span.type.toLowerCase() }" data-index="${ (<any>sT.span).index }">`);
					const singleScore = (<any>sT.span).singleScore;
					if (singleScore) {
						out.append(`<span class="single-score">${ singleScore.toFixed(3) }</span>`);
					}
				} else {
					out.append(`</mark>`);
				}
			}
		}
		
		out.append(text.slice(offset, text.length));
		return out.__content;
	}
}
