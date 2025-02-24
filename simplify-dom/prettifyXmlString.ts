const prettifyXmlString = function(sourceXml : string) : string | null {
    var parser = new DOMParser();
    
    // Parse source XML
    var xmlDoc = parser.parseFromString(sourceXml, 'application/xml');
    if (xmlDoc.getElementsByTagName("parsererror").length) {
        console.error("Error parsing source XML", xmlDoc.getElementsByTagName("parsererror"));
        //return null; // or you could throw an error
    }

    // Parse the XSLT stylesheet
    var xsltStr = [
        '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:strip-space elements="*"/>',
        '  <xsl:template match="para[content-style][not(text())]">',
        '    <xsl:value-of select="normalize-space(.)"/>',
        '  </xsl:template>',
        '  <xsl:template match="node()|@*">',
        '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
        '  </xsl:template>',
        '  <xsl:output indent="yes"/>',
        '</xsl:stylesheet>',
    ].join('\n');
    
    var xsltDoc = parser.parseFromString(xsltStr, 'application/xml');
    if (xsltDoc.getElementsByTagName("parsererror").length) {
        console.error("Error parsing XSLT");
        return null; // or you could throw an error
    }

    // Apply the stylesheet to the XML
    var xsltProcessor = new XSLTProcessor();    
    xsltProcessor.importStylesheet(xsltDoc);
    var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
    
    // Serialize result to string
    var resultXml = new XMLSerializer().serializeToString(resultDoc);
    return resultXml;
}; 

export default prettifyXmlString;