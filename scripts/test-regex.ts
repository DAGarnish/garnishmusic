const text = `[vc_row_inner css=".vc_custom_1653323693945{background-color: #a0a0a0 !important;background-position: center !important;background-repeat: no-repeat !important;background-size: cover !important;}"][vc_column_inner css=".vc_custom_1653323525760{background-color: #f8f8f8 !important;}"][vc_column_text]
<h3><strong>Stay Connected</strong></h3>
<em>We will not share your information</em>

[/vc_column_text][contact-form-7 id="5689"][/vc_column_inner][/vc_row_inner]`;

const regex = /\[vc_row_inner[^\]]*\](?:(?!\[\/?vc_row_inner)[^])*?Stay Connected(?:(?!\[\/?vc_row_inner)[^])*?\[\/vc_row_inner\]/ig;
console.log("Matches:", text.match(regex));
