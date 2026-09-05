#!/usr/bin/env python3
"""Guarded local publication executor. Use --dry-run for report-only verification."""
from __future__ import annotations
import argparse,json,sys
from pathlib import Path
try: from ._workflow import emit,sha256,atomic,parse,now
except ImportError: from _workflow import emit,sha256,atomic,parse,now

def publish(draft:Path,approval:Path,readiness:Path|None,output_root:Path,dry_run=False):
 reasons=[]
 if not approval.exists(): reasons.append('MISSING_APPROVAL')
 if not draft.exists(): reasons.append('MISSING_DRAFT')
 if reasons: return {'status':'BLOCKED','reasons':reasons}
 try: appr=json.loads(approval.read_text())
 except (OSError,json.JSONDecodeError): return {'status':'BLOCKED','reasons':['INVALID_APPROVAL']}
 h=sha256(draft)
 if appr.get('approved') is not True: reasons.append('NOT_EXPLICITLY_APPROVED')
 if appr.get('draft_hash') != h: reasons.append('APPROVAL_HASH_MISMATCH')
 if not isinstance(appr.get('reviewer'),str) or not appr['reviewer'].strip(): reasons.append('MISSING_REVIEWER')
 if not isinstance(appr.get('timestamp'),str) or not appr['timestamp'].strip(): reasons.append('MISSING_TIMESTAMP')
 report_path=Path(readiness or appr.get('readiness_report',''))
 if not report_path.is_file(): reasons.append('MISSING_READINESS_REPORT')
 else:
  try: report=json.loads(report_path.read_text())
  except (OSError,json.JSONDecodeError): report={}
  if report.get('status')!='PASS' or report.get('draft_hash') not in (None,h): reasons.append('READINESS_NOT_PASSED')
 if reasons: return {'status':'BLOCKED','reasons':list(dict.fromkeys(reasons)),'draft_hash':h}
 result={'status':'DRY_RUN' if dry_run else 'PUBLISHED','draft':str(draft),'draft_hash':h,'reviewer':appr['reviewer'],'timestamp':appr['timestamp'],'target':str(output_root/draft.name)}
 if not dry_run:
  output_root.mkdir(parents=True,exist_ok=True); atomic(output_root/draft.name,draft.read_text()); atomic(output_root/f'{draft.stem}.publication.json',json.dumps(result,indent=2,sort_keys=True)+'\n')
 return result

def main(argv=None):
 p=argparse.ArgumentParser(); p.add_argument('--draft',required=True,type=Path); p.add_argument('--approval',required=True,type=Path); p.add_argument('--readiness',type=Path); p.add_argument('--output-root',type=Path,default=Path('content/published')); p.add_argument('--dry-run',action='store_true'); p.add_argument('--report-only',action='store_true'); a=p.parse_args()
 try:
  result=publish(a.draft,a.approval,a.readiness,a.output_root,a.dry_run or a.report_only); emit(result); return 0 if result['status'] in {'DRY_RUN','PUBLISHED'} else 1
 except (OSError,ValueError,TypeError) as e: emit({'status':'BLOCKED','reasons':['INPUT_ERROR',str(e)]}); return 2
if __name__=='__main__': sys.exit(main())
