var Coref = (function () {
    function Coref(endpoint, opts) {
        this.onStart = function () { };
        this.onSuccess = function () { };
        this.endpoint = endpoint;
        if (opts.onStart) {
            this.onStart = opts.onStart;
        }
        if (opts.onSuccess) {
            this.onSuccess = opts.onSuccess;
        }
        window.addEventListener('resize', this.svgResize);
    }
    Coref.prototype.svgResize = function () {
        if (!this.container || !this.svgContainer) {
            return;
        }
        this.svgContainer.setAttribute('width', "" + this.container.scrollWidth);
        this.svgContainer.setAttribute('height', "" + this.container.scrollHeight);
    };
    Coref.prototype.parse = function (text) {
        var _this = this;
        this.onStart();
        var path = this.endpoint + "?text=" + encodeURIComponent(text);
        var request = new XMLHttpRequest();
        request.open('GET', path);
        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                _this.onSuccess();
                var res = JSON.parse(request.responseText);
                _this.render(res);
            }
            else {
                console.error('Error', request);
            }
        };
        request.send();
    };
    Coref.prototype.render = function (res) {
        var _this = this;
        var mentions = res.mentions;
        for (var _i = 0, mentions_1 = mentions; _i < mentions_1.length; _i++) {
            var m = mentions_1[_i];
            m.singleScore = res.singleScores[m.index] || undefined;
        }
        var markup = Displacy.render(res.cleanedText, mentions);
        if (!this.container || !this.svgContainer) {
            return;
        }
        this.container.innerHTML = "<div class=\"text\">" + markup + "</div>";
        this.svgContainer.textContent = "";
        this.svgResize();
        window.container = this.container;
        window.svgContainer = this.svgContainer;
        var endY = document.querySelector('.container .text').getBoundingClientRect().top
            - this.container.getBoundingClientRect().top
            - 2;
        SvgArrow.yArrows = endY;
        for (var _a = 0, _b = Object.entries(res.pairScores); _a < _b.length; _a++) {
            var _c = _b[_a], __from = _c[0], scores = _c[1];
            var from = parseInt(__from, 10);
            for (var _d = 0, _e = Object.entries(scores); _d < _e.length; _d++) {
                var _f = _e[_d], __to = _f[0], score = _f[1];
                var to = parseInt(__to, 10);
                var markFrom = document.querySelector("mark[data-index=\"" + from + "\"]");
                var markTo = document.querySelector("mark[data-index=\"" + to + "\"]");
                var arrow = new SvgArrow(this.container, markFrom, markTo, score);
                if (score >= Math.max.apply(Math, Object.values(scores))) {
                    arrow.classNames.push('score-ok');
                    var singleScore = res.singleScores[from];
                    if (singleScore && score >= singleScore) {
                        arrow.classNames.push('score-best');
                    }
                }
                this.svgContainer.appendChild(arrow.generate());
            }
        }
        document.querySelectorAll('.displacy-arrow.score-ok').forEach(function (arw) {
            _this.svgContainer.appendChild(arw);
        });
    };
    return Coref;
}());
var Displacy = (function () {
    function Displacy() {
    }
    Displacy.sortSpans = function (spans) {
        spans.sort(function (a, b) {
            if (a.start === b.start) {
                return b.end - a.end;
            }
            return a.start - b.start;
        });
        spans.forEach(function (s, i) {
            if (i < spans.length - 1) {
                var sNext = spans[i + 1];
                if (s.start < sNext.start && s.end > sNext.start) {
                    console.log("ERROR", "Spans: strict overlapping");
                }
            }
        });
    };
    Displacy.render = function (text, spans) {
        this.sortSpans(spans);
        var tags = {};
        var __addTag = function (i, s, tag) {
            if (Array.isArray(tags[i])) {
                tags[i].push({ span: s, tag: tag });
            }
            else {
                tags[i] = [{ span: s, tag: tag }];
            }
        };
        for (var _i = 0, spans_1 = spans; _i < spans_1.length; _i++) {
            var s = spans_1[_i];
            __addTag(s.start, s, "start");
            __addTag(s.end, s, "end");
        }
        var out = {
            __content: "",
            append: function (s) {
                this.__content += s;
            }
        };
        var offset = 0;
        var indexes = Object.keys(tags).map(function (k) { return parseInt(k, 10); }).sort(function (a, b) { return a - b; });
        for (var _a = 0, indexes_1 = indexes; _a < indexes_1.length; _a++) {
            var i = indexes_1[_a];
            var spanTags = tags[i];
            if (i > offset) {
                out.append(text.slice(offset, i));
            }
            offset = i;
            for (var _b = 0, spanTags_1 = spanTags; _b < spanTags_1.length; _b++) {
                var sT = spanTags_1[_b];
                if (sT.tag === "start") {
                    out.append("<mark data-entity=\"" + sT.span.type.toLowerCase() + "\" data-index=\"" + sT.span.index + "\">");
                    var singleScore = sT.span.singleScore;
                    if (singleScore) {
                        out.append("<span class=\"single-score\">" + singleScore.toFixed(3) + "</span>");
                    }
                }
                else {
                    out.append("</mark>");
                }
            }
        }
        out.append(text.slice(offset, text.length));
        return out.__content;
    };
    return Displacy;
}());
var SvgArrow = (function () {
    function SvgArrow(container, markFrom, markTo, score) {
        this.classNames = [];
        this.container = container;
        this.markFrom = markFrom;
        this.markTo = markTo;
        this.score = score;
    }
    SvgArrow.prototype._el = function (tag, options) {
        var _a = options.classnames, classnames = _a === void 0 ? [] : _a, _b = options.attributes, attributes = _b === void 0 ? [] : _b, _c = options.style, style = _c === void 0 ? [] : _c, _d = options.children, children = _d === void 0 ? [] : _d, text = options.text, id = options.id, xlink = options.xlink;
        var ns = 'http://www.w3.org/2000/svg';
        var nsx = 'http://www.w3.org/1999/xlink';
        var el = document.createElementNS(ns, tag);
        classnames.forEach(function (name) { return el.classList.add(name); });
        attributes.forEach(function (_a) {
            var attr = _a[0], value = _a[1];
            return el.setAttribute(attr, value);
        });
        style.forEach(function (_a) {
            var prop = _a[0], value = _a[1];
            return el.style[prop] = value;
        });
        if (xlink)
            el.setAttributeNS(nsx, 'xlink:href', xlink);
        if (text)
            el.appendChild(document.createTextNode(text));
        if (id)
            el.id = id;
        children.forEach(function (child) { return el.appendChild(child); });
        return el;
    };
    SvgArrow.prototype.generate = function () {
        var rand = Math.random().toString(36).substr(2, 8);
        var startX = this.markTo.getBoundingClientRect().left
            - this.container.getBoundingClientRect().left
            + this.markTo.getBoundingClientRect().width / 2;
        var endX = this.markFrom.getBoundingClientRect().left
            - this.container.getBoundingClientRect().left
            + this.markFrom.getBoundingClientRect().width / 2;
        var curveY = Math.max(-50, SvgArrow.yArrows - (endX - startX) / 3.2);
        return this._el('g', {
            classnames: ['displacy-arrow'].concat(this.classNames),
            children: [
                this._el('path', {
                    id: "arrow-" + rand,
                    classnames: ['displacy-arc'],
                    attributes: [
                        ['d', "M" + startX + "," + SvgArrow.yArrows + " C" + startX + "," + curveY + " " + endX + "," + curveY + " " + endX + "," + SvgArrow.yArrows],
                        ['stroke-width', '2px'],
                        ['fill', 'none'],
                        ['stroke', 'currentColor'],
                    ]
                }),
                this._el('text', {
                    attributes: [
                        ['dy', '1em']
                    ],
                    children: [
                        this._el('textPath', {
                            xlink: "#arrow-" + rand,
                            classnames: ['displacy-label'],
                            attributes: [
                                ['startOffset', '50%'],
                                ['fill', 'currentColor'],
                                ['text-anchor', 'middle'],
                            ],
                            text: this.score.toFixed(2)
                        })
                    ]
                }),
            ]
        });
    };
    SvgArrow.yArrows = 0;
    return SvgArrow;
}());
var ENDPOINT = "https://coref.huggingface.co/coref";
var DEFAULT_NLP_TEXT = function () {
    var items = [
        "I love my father and my mother. They work hard. She is always nice but he is sometimes rude.",
        "My sister is swimming with her classmates. They are not bad, but she is better. I love watching her swim.",
        "My mother's name is Sasha, she likes dogs."
    ];
    return items[Math.floor(Math.random() * items.length)];
};
var loading = function () {
    document.body.classList.toggle('loading');
};
var toggleDebug = function () {
    document.body.classList.toggle('debug');
    var icons = document.querySelectorAll('.svg-checkbox');
    icons.forEach(function (icon) {
        icon.classList.toggle('hide');
    });
    window.localStorage.setItem('debug', document.body.classList.contains('debug').toString());
};
var coref = new Coref(ENDPOINT, {
    onStart: loading,
    onSuccess: loading,
});
var getQueryVar = function (key) {
    var query = window.location.search.substring(1);
    var params = query.split('&').map(function (param) { return param.split('='); });
    for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
        var param = params_1[_i];
        if (param[0] === key) {
            return decodeURIComponent(param[1]);
        }
    }
    return undefined;
};
var updateURL = function (text) {
    history.pushState({ text: text }, "", "?text=" + encodeURIComponent(text));
};
document.addEventListener('DOMContentLoaded', function () {
    var $input = document.querySelector('input.input-message');
    var $form = document.querySelector('form.js-form');
    var $checkbox = document.querySelector('.js-checkbox');
    var $svgContainer = document.querySelector('.svg-container');
    coref.container = document.querySelector('.container');
    coref.svgContainer = $svgContainer;
    {
        var queryText = getQueryVar('text');
        if (queryText) {
            $input.value = queryText;
            coref.parse(queryText);
        }
        else {
            coref.parse(DEFAULT_NLP_TEXT());
        }
    }
    $input.addEventListener('keydown', function (evt) {
        if (evt.charCode === 13) {
            evt.preventDefault();
            $form.submit();
        }
    });
    $form.addEventListener('submit', function (evt) {
        evt.preventDefault();
        var text = ($input.value.length > 0)
            ? $input.value
            : DEFAULT_NLP_TEXT();
        updateURL(text);
        coref.parse(text);
    });
    $checkbox.addEventListener('click', function () {
        toggleDebug();
    });
    if (window.localStorage.getItem('debug') !== 'false') {
        toggleDebug();
    }
});