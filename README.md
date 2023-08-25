# Airtable Upsert Examples

This repository contains examples demonstrating how to "upsert" (update or
insert) records to an Airtable table in various programming languages and
environments, including both (a) "generic" and (b) "data source specific"
examples.

(a) The following six generic examples are available at the top level of this
repository:

- **Node/Javascript**
  - [_using airtable.js_](javascript/using_airtable.js/) (Airtable's first-party
    Javascript SDK)
  - [_using node-fetch_](javascript/using_node-fetch/) (for when you need to use
    minimal external dependencies)
  - [_using Airtable Scripting Apps_](javascript/using_airtable-scripting/) (
    when you want Airtable to host your Javascript code alongside your base)
- **PHP**
  - [_using guzzle_](php/using_guzzle/) (a popular HTTP client)
- **Python**
  - [_using pyairtable_](python/using_pyairtable/) (a community-supported
    Airtable SDK)
- **R**
  - [_using httr_](r/using_httr/) (a popular HTTP client)
- **Ruby**
  - [_using Faraday_](ruby/using_faraday/) (a popular HTTP client)

(b) Data source specific examples can be found in the
[`data_source_examples` directory](data_source_examples/).

Pull requests are welcome!

---

The software made available from this repository is not supported by Formagrid
Inc (Airtable) or part of the Airtable Service. It is made available on an "as
is" basis and provided without express or implied warranties of any kind.

---
