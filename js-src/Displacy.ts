

/**
 * Indicates position of spans of text inside the string. 
 * (for visual applications only, no semantic sense here.)
 */
interface Span {
	type:  string;
	start: number;
	end:   number;
}

class Displacy {
	
	/**
	 * Render a text string and its entity spans
	 * 
	 * *see displacy-ent.js*
	 */
	static render(text: string, spans: Span[]): string {
		let out = {
			__content: "",
			append(s: string) {
				this.__content += s;
			}
		};
		let offset = 0;
		
		spans.forEach(({ type, start, end }) => {
			const entity = text.slice(start, end);
			const fragments = text.slice(offset, start).split('\n');
			
			fragments.forEach((fragment, i) => {
				out.append(fragment);
				if (fragments.length > 1 && i !== fragments.length - 1) {
					out.append('<br>');
				}
			});
			
			// Breaking change from displacy-ent.js:
			// We do not filter any entity type out.
			out.append(`<mark data-entity=${ type.toLowerCase() }>${ entity }</mark>`);
			
			offset = end;
		});
		
		out.append(text.slice(offset, text.length));
		return out.__content;
	}
}
