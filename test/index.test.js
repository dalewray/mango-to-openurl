const nock = require('nock');
const assert = require('assert');
const { mangoISBN, replaceUrl } = require('../helpers');
const { refreshReply, catalogReply,
    isbn, title, ucfUrl, openUrlVid
} = require('./data');


describe('Get ISBN', function() {
    beforeEach(function() {
        nock('https://ucf.catalog.fcla.edu')
        .get('/permalink.jsp?29CF037571347')
        .reply(200, refreshReply);

        nock('http://ucf.catalog.fcla.edu')
        .get('/?st=CF038054365&ix=pm&I=0&V=D&pm=1&fl=ba')
        .reply(200, catalogReply);
    });

        it('should follow meta redirect', async function() {
            assert.strictEqual('168263146X', 
                await mangoISBN('https://ucf.catalog.fcla.edu/permalink.jsp?29CF037571347')
            );
        });

        it('should handle no redirect', async function() {
            assert.strictEqual('168263146X', 
                await mangoISBN('http://ucf.catalog.fcla.edu/?st=CF038054365&ix=pm&I=0&V=D&pm=1&fl=ba')
            );
        });
    
});

describe('Url methods', function() {
    it('should replace the url', function() {
        assert.strictEqual(
            'https://ucf.edu&ctx_ver=Z39.88-2004&rft.genre=book&ctx_enc=info:ofi%2Fenc:UTF-8&url_ver=Z39.88-2004&url_ctx_fmt=infofi%2Ffmt:kev:mtx:ctx&rft.isbn=0000000001&vid=<Primo_view_code>',
            replaceUrl(isbn, title, ucfUrl, openUrlVid)
        );
    });

    it('should suggest a url', function() {
        assert.strictEqual(
            'https://ucf.edu&ctx_ver=Z39.88-2004&rft.genre=book&ctx_enc=info:ofi%2Fenc:UTF-8&url_ver=Z39.88-2004&url_ctx_fmt=infofi%2Ffmt:kev:mtx:ctx&rft.isbn=&vid=<Primo_view_code>&rft.btitle=Resource%2520Title',
            replaceUrl('', title, ucfUrl, openUrlVid)
        );
    });
});