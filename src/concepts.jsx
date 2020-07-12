import ForgeUI, { render, Fragment, Macro, Text, Table, Head, Cell, Row, useProductContext, useState } from "@forge/ui";
import api from '@forge/api';

const URL = 'https://api.us-east.natural-language-understanding.watson.cloud.ibm.com/instances/871f5fce-98dd-4dc9-b77d-e28dc429866f';

async function getAnalysis(contentId) {
    const contentResponse = await api.asApp().requestConfluence(`/rest/api/content/${contentId}?expand=body.storage`);
    await checkResponse('Confluence API', contentResponse);
    const contentData = await contentResponse.json();
    const content = contentData.body.storage.value;

    const conceptResponse = await api.fetch(`${URL}/v1/analyze?version=2019-07-12`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${Buffer.from(`apikey:${process.env.NLU_API_KEY}`).toString('base64')}`,
        },
        body: JSON.stringify({
            "html": content,
            "features": {
                "concepts": {
                    "limit": 3
                }
            }
        })
    });
    await checkResponse('IBM Natural Language Understanding API', conceptResponse);
    const conceptData = await conceptResponse.json();
    return conceptData;
}

function showAnalysis(value) {
    const concepts = value.concepts;
    return (
        <Table>
            <Head>
                <Cell>
                    <Text content="Concept" />
                </Cell>
                <Cell>
                    <Text content="Relevance" />
                </Cell>
                <Cell>
                    <Text content="DBpedia Resource" />
                </Cell>
            </Head>
            {concepts.map(concept => <Row>
                <Cell>
                    <Text>{concept.text}</Text>
                </Cell>
                <Cell>
                    <Text>{Math.round(concept.relevance * 10000) / 100}%</Text>
                </Cell>
                <Cell>
                    <Text>[Link to {concept.text}]({concept.dbpedia_resource})</Text>
                </Cell>
            </Row>)}
        </Table>
    )
}

const Concepts = () => {

    const { context, contentId } = useProductContext();
    const [value, setValue] = useState(getAnalysis(contentId));

    return (
        <Fragment>
            {showAnalysis(value)}
        </Fragment>
    );
};

async function checkResponse(apiName, response) {
    if (!response.ok) {
        const message = `Error from ${apiName}: ${response.status} ${await response.text()}`;
        console.error(message);
        throw new Error(message);
    }
}

export const run = render(
    <Macro
        app={<Concepts />}
    />
);