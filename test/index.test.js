const nock = require('nock');
const assert = require('assert');
const {mangoISBN} = require('../helpers');

const refreshReply = `
<HTML><HEAD>
<META HTTP-EQUIV="Refresh" CONTENT="0; URL=http://ucf.catalog.fcla.edu/?st=CF038054365&ix=pm&I=0&V=D&pm=1&fl=ba">
</HEAD></HTML>`;

const catalogReply = `
<!DOCTYPE html PUBLIC "-//W3C//Dtd XHTML 1.0 transitional//EN" "http://www.w3.org/tr/xhtml1/Dtd/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xml:lang="en">
<head><title>Online Catalog - UCF Libraries</title></head>
<body><table>
<tr><td id="ISBN">168263146X</td></tr>
<tr><td id="ISBN">9781682631461</td></tr>
</table></body></html>
`;

describe('Get Meta Forward', function() {
    beforeEach(function() {
        nock('https://ucf.catalog.fcla.edu')
        .get('/permalink.jsp?29CF037571347')
        .reply(200, refreshReply);

        nock('http://ucf.catalog.fcla.edu')
        .get('/?st=CF038054365&ix=pm&I=0&V=D&pm=1&fl=ba')
        .reply(200, catalogReply);
    });

    describe('Parsed Meta Forward', function() {
        it('should follow meta redirect', async function() {
            assert.strictEqual('168263146X', 
                await mangoISBN('https://ucf.catalog.fcla.edu/permalink.jsp?29CF037571347')
            );
        });
    });
});
