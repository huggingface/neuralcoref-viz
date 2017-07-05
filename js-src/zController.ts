
const ENDPOINT = "http://spacy.huggingface.co:8000/all";
const DEFAULT_NLP_TEXT = `'Lawrence of Arabia' is a highly rated film biography about British Lieutenant T. E. Lawrence. Peter O'Toole plays Lawrence in the film.`;

const loading = () => {
	document.body.classList.toggle('loading');
};

const toggleDebug = () => {
	document.body.classList.toggle('debug');
	const icons = document.querySelectorAll('.svg-checkbox');
	(<any>icons).forEach((icon) => {
		icon.classList.toggle('hide');
	});
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
	const $input    = document.querySelector('input.input-message') as HTMLInputElement;
	const $form     = document.querySelector('form.js-form') as HTMLFormElement;
	const $checkbox = document.querySelector('.js-checkbox') as HTMLElement;
	coref.container = document.querySelector('.container') as HTMLElement;
	
	{
		// Initial text
		const queryText = getQueryVar('text');
		if (queryText) {
			$input.value = queryText;
			coref.parse(queryText);
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
			: DEFAULT_NLP_TEXT;
		updateURL(text);
		coref.parse(text);
	});
	
	$checkbox.addEventListener('click', () => {
		toggleDebug();
	});
	
	// Turn on debug mode by default:
	toggleDebug();
});


