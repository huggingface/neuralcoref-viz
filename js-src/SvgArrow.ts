

class SvgArrow {
	static yArrows: number = 0;
	
	container: HTMLElement;
	markFrom: HTMLElement;
	markTo:   HTMLElement;
	score: number;
	classNames: string[] = [];
	constructor(container: HTMLElement, markFrom: HTMLElement, markTo: HTMLElement, score: number) {
		this.container = container;
		this.markFrom = markFrom;
		this.markTo   = markTo;
		this.score    = score;
	}
	
	/// From displacy.js
	_el(tag, options): SVGElement {
		const { classnames = [], attributes = [], style = [], children = [], text, id, xlink } = options;
		const ns = 'http://www.w3.org/2000/svg';
		const nsx = 'http://www.w3.org/1999/xlink';
		const el = document.createElementNS(ns, tag);

		classnames.forEach(name => el.classList.add(name));
		attributes.forEach(([attr, value]) => el.setAttribute(attr, value));
		style.forEach(([ prop, value ]) => el.style[prop] = value);
		if(xlink) el.setAttributeNS(nsx, 'xlink:href', xlink);
		if(text) el.appendChild(document.createTextNode(text));
		if(id) el.id = id;
		children.forEach(child => el.appendChild(child));
		return el;
	}
	
	
	generate(): SVGElement {
		const rand = Math.random().toString(36).substr(2, 8);
		
		const startX = this.markTo.getBoundingClientRect().left 
			- this.container.getBoundingClientRect().left
			+ this.markTo.getBoundingClientRect().width / 2;
		
		const endX = this.markFrom.getBoundingClientRect().left 
			- this.container.getBoundingClientRect().left
			+ this.markFrom.getBoundingClientRect().width / 2;
		
		const curveY = Math.max(-50, SvgArrow.yArrows - (endX - startX) / 3.2);
		
		return this._el('g', {
			classnames: [ 'displacy-arrow' ].concat(this.classNames),
			children: [
				this._el('path', {
					id: `arrow-${rand}`,
					classnames: [ 'displacy-arc' ],
					attributes: [
						[ 'd', `M${startX},${SvgArrow.yArrows} C${startX},${curveY} ${endX},${curveY} ${endX},${SvgArrow.yArrows}`],
						[ 'stroke-width', '2px' ],
						[ 'fill', 'none' ],
						[ 'stroke', 'currentColor' ],
					]
				}),
				this._el('text', {
					attributes: [
						[ 'dy', '1em' ]
					],
					children: [
						this._el('textPath', {
							xlink: `#arrow-${rand}`,
							classnames: [ 'displacy-label' ],
							attributes: [
								[ 'startOffset', '50%' ],
								[ 'fill', 'currentColor' ],
								[ 'text-anchor', 'middle' ],
							],
							text: this.score.toFixed(2)
						})
					]
				}),
			]
		});
	}
}
