
const ENDPOINT = "https://coref.huggingface.co/coref";
const DEFAULT_NLP_TEXT = () => {
	const items = [
		`I love my father and my mother. They work hard. She is always nice but he is sometimes rude.`,
		`My sister is swimming with her classmates. They are not bad, but she is better. I love watching her swim.`,
		`My mother's name is Sasha, she likes dogs.`
	];
	return items[Math.floor(Math.random()*items.length)];
}

const loading = () => {
	document.body.classList.toggle('loading');
};

const toggleDebug = () => {
	document.body.classList.toggle('debug');
	const icons = document.querySelectorAll('.svg-checkbox');
	(<any>icons).forEach((icon) => {
		icon.classList.toggle('hide');
	});
	/// local storage
	window.localStorage.setItem('debug', document.body.classList.contains('debug').toString());
};

const coref = new Coref(ENDPOINT, {
	onStart: loading,
	onSuccess: loading,
});

const getQueryVar = (key: string) => {
	const query = window.location.search.substring(1);
	const params = query.split('&').map(param => param.split('='));
	for (const param of params) {
		if (param[0] === key) { return decodeURIComponent(param[1]); }
	}
	return undefined;
}

const updateURL = (text) => {
	history.pushState({ text: text }, "", `?text=${encodeURIComponent(text)}`);
}

document.addEventListener('DOMContentLoaded', () => {
	const $input        = document.querySelector('input.input-message') as HTMLInputElement;
	const $form         = document.querySelector('form.js-form') as HTMLFormElement;
	const $checkbox     = document.querySelector('.js-checkbox') as HTMLElement;
	const $svgContainer = document.querySelector('.svg-container') as SVGSVGElement;
	coref.container     = document.querySelector('.container') as HTMLElement;
	coref.svgContainer  = $svgContainer;
	
	{
		// Initial text
		const queryText = getQueryVar('text');
		if (queryText) {
			$input.value = queryText;
			coref.parse(queryText);
		} else {
			coref.parse(DEFAULT_NLP_TEXT());  // Trigger run with default text.
		}
	}
	
	$input.addEventListener('keydown', (evt) => {
		if (evt.charCode === 13) {
			// 13 is the Enter key
			evt.preventDefault();
			$form.submit();
		}
	});
	
	$form.addEventListener('submit', (evt) => {
		evt.preventDefault();
		const text = ($input.value.length > 0)
			? $input.value
			: DEFAULT_NLP_TEXT();
		updateURL(text);
		coref.parse(text);
	});
	
	$checkbox.addEventListener('click', () => {
		toggleDebug();
	});
	
	// Turn on debug mode by default, unless `false` is stored in local storage:
	if (window.localStorage.getItem('debug') !== 'false') {
		toggleDebug();
	}
});


