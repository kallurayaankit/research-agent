"""Test real tokenizer + ONNX WASM execution with a tiny synthetic encoder.

No external model downloads; this verifies integration, not semantic quality.
"""
import json
import math
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

base=os.getenv('BRAM_PUBLIC_TEST_URL','http://127.0.0.1:8002/dist/')
fixture=(Path(__file__).parent/'fixtures/tiny_encoder.onnx').read_bytes()
tokenizer={
    'version':'1.0','truncation':None,'padding':None,'added_tokens':[],
    'normalizer':{'type':'BertNormalizer','clean_text':True,'handle_chinese_chars':True,'strip_accents':None,'lowercase':True},
    'pre_tokenizer':{'type':'BertPreTokenizer'},
    'post_processor':{'type':'TemplateProcessing','single':[{'SpecialToken':{'id':'[CLS]','type_id':0}},{'Sequence':{'id':'A','type_id':0}},{'SpecialToken':{'id':'[SEP]','type_id':0}}],'pair':[], 'special_tokens':{'[CLS]':{'id':'[CLS]','ids':[2],'tokens':['[CLS]']},'[SEP]':{'id':'[SEP]','ids':[3],'tokens':['[SEP]']}}},
    'decoder':{'type':'WordPiece','prefix':'##','cleanup':True},
    'model':{'type':'WordPiece','unk_token':'[UNK]','continuing_subword_prefix':'##','max_input_chars_per_word':100,'vocab':{'[PAD]':0,'[UNK]':1,'[CLS]':2,'[SEP]':3,'hello':4,'world':5}},
}
config={'tokenizer_class':'BertTokenizer','model_max_length':256,'unk_token':'[UNK]','sep_token':'[SEP]','pad_token':'[PAD]','cls_token':'[CLS]','mask_token':'[MASK]'}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    context=browser.new_context(service_workers='block')
    def route_model(route):
        url=route.request.url
        if url.endswith('tokenizer.json'):
            route.fulfill(content_type='application/json',body=json.dumps(tokenizer))
        elif url.endswith('tokenizer_config.json'):
            route.fulfill(content_type='application/json',body=json.dumps(config))
        elif url.endswith('model_quantized.onnx'):
            route.fulfill(content_type='application/octet-stream',body=fixture)
        else:
            route.abort()
    context.route('https://huggingface.co/**',route_model)
    page=context.new_page()
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(base)
    result=page.evaluate("""async()=>{
      const module=await import('./embeddings.js');
      return {pool:module.meanPool([3,4,100,100],[1,2,2],[1n,0n]),vectors:await module.embed(['hello world','hello'])};
    }""")
    assert abs(result['pool'][0][0]-.6)<1e-6
    assert abs(result['pool'][0][1]-.8)<1e-6
    for vector in result['vectors']:
        assert len(vector)==2
        assert abs(sum(x*x for x in vector)-1)<1e-5
    assert abs(result['vectors'][0][0]-3.5/math.sqrt(3.5**2+1))<1e-5
    assert abs(result['vectors'][1][0]-3/math.sqrt(10))<1e-5
    assert not errors,errors
    browser.close()
    print('Real tokenizer + WASM inference passed; padding-aware pooling and normalized embeddings verified with a synthetic encoder.')
