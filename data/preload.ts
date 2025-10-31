import lysholm from './questionnaires/lysholm.json';
import ikdc from './questionnaires/ikdc.json';
import prtee from './questionnaires/prtee.json';
import prwe from './questionnaires/prwe.json';
import womac from './questionnaires/womac.json';
import aclrsi from './questionnaires/acl-rsi.json';
import mhq from './questionnaires/mhq.json';
import koos from './questionnaires/koos.json';
import lefs from './questionnaires/lefs.json';
import dash from './questionnaires/dash.json';
import ndi from './questionnaires/ndi.json';
import odi from './questionnaires/odi.json';
import spadi from './questionnaires/spadi.json';
import rmdq from './questionnaires/rmdq.json';
import faam from './questionnaires/faam.json';
import faos from './questionnaires/faos.json';
import hoos from './questionnaires/hoos.json';
import ihot12 from './questionnaires/ihot12.json';
import tsk11 from './questionnaires/tsk11.json';
import cpg from './questionnaires/cpg.json';
import aofas from './questionnaires/aofas.json';
import hagos from './questionnaires/hagos.json';
import nbq from './questionnaires/nbq.json';
import oss from './questionnaires/oss.json';
import qbpds from './questionnaires/qbpds.json';
import sbst from './questionnaires/sbst.json';
import wosi from './questionnaires/wosi.json';

import { Questionnaire } from '../types';

export function getPreloadedQuestionnaires(): Questionnaire[] {
  const base: Omit<Questionnaire, 'id'>[] = [
    lysholm as any,
    ikdc as any,
    prtee as any,
    prwe as any,
    womac as any,
    aclrsi as any,
    mhq as any,
    koos as any,
    lefs as any,
    dash as any,
    ndi as any,
    odi as any,
    spadi as any,
    rmdq as any
    ,faam as any
    ,faos as any
    ,hoos as any
    ,ihot12 as any
    ,tsk11 as any
    ,cpg as any
    ,aofas as any
    ,hagos as any
    ,nbq as any
    ,oss as any
    ,qbpds as any
    ,sbst as any
    ,wosi as any
  ];
  return base.map(q => ({
    ...q,
    id: `${q.acronym}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
  }));
}


