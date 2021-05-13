# mango-to-openurl


This script is designed to convert permalinks from a library catalog using the Mango Platform to permalinks formatted in the OpenURL standard.  It is specifically written to convert permalinks used in SpringShare’s LibGuides link assets.
Options are available in config.json or may be passed via the command line.

`yarn prod` will run with options in config.json

`yarn test` will run only the first 10 records

`yarn log` will run yarn prod and save standard output to log.txt

pass arguments example:
`yarn prod testTrueOrFalse rateLimitInMicroseconds OldStemURL NewStemURL Primo_view_code InputFile.csv OutputFile.csv`

If an asset does not have a url matching oldStemUrl the record ID will be output and skipped with a message

If an assert does not have a url, an attempt to create on based on the record title will be generated and added to a new column 'SuggestedUrl'

If an asset has a url, the existing url will be replaced and a message with the new url will be output.

