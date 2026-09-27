const KEYWORDS: Record<string, string[]> = {
  javascript: ['abstract','await','break','case','catch','class','const','continue','debugger','default','delete','do','else','enum','export','extends','false','finally','for','function','if','implements','import','in','instanceof','interface','let','new','null','of','package','private','protected','public','return','static','super','switch','this','throw','true','try','typeof','undefined','var','void','while','with','yield','async','from','as','get','set','and'],
  typescript: ['abstract','any','as','async','await','boolean','break','case','catch','class','const','constructor','continue','declare','default','delete','do','else','enum','export','extends','false','finally','for','from','function','get','if','implements','import','in','infer','instanceof','interface','keyof','let','module','namespace','never','new','null','number','object','of','override','package','private','protected','public','readonly','return','set','static','string','super','switch','symbol','this','throw','true','try','type','typeof','undefined','unknown','var','void','while','with','yield'],
  python: ['False','None','True','and','as','assert','async','await','break','class','continue','def','del','elif','else','except','finally','for','from','global','if','import','in','is','lambda','nonlocal','not','or','pass','raise','return','try','while','with','yield','self','cls','super','property','staticmethod','classmethod','print','range','len','type','int','str','float','bool','list','dict','set','tuple'],
  rust: ['as','async','await','break','const','continue','crate','dyn','else','enum','extern','false','fn','for','if','impl','in','let','loop','match','mod','move','mut','pub','ref','return','self','Self','static','struct','super','trait','true','type','union','unsafe','use','where','while','i8','i16','i32','i64','i128','u8','u16','u32','u64','u128','f32','f64','bool','char','str','String','Vec','Option','Result','Some','None','Ok','Err'],
  go: ['break','case','chan','const','continue','default','defer','else','fallthrough','for','func','go','goto','if','import','interface','map','package','range','return','select','struct','switch','type','var','true','false','nil','int','int8','int16','int32','int64','uint','uint8','uint16','uint32','uint64','float32','float64','bool','byte','rune','string','error','make','new','len','cap','append','copy','delete','close','panic','recover','fmt'],
  java: ['abstract','assert','boolean','break','byte','case','catch','char','class','const','continue','default','do','double','else','enum','extends','final','finally','float','for','goto','if','implements','import','instanceof','int','interface','long','native','new','null','package','private','protected','public','return','short','static','strictfp','super','switch','synchronized','this','throw','throws','transient','true','try','void','volatile','while','false','String','System','var'],
  cpp: ['alignas','alignof','auto','bool','break','case','catch','char','class','const','constexpr','continue','decltype','default','delete','do','double','dynamic_cast','else','enum','explicit','extern','false','float','for','friend','goto','if','inline','int','long','mutable','namespace','new','nullptr','operator','private','protected','public','reinterpret_cast','return','short','signed','sizeof','static','static_cast','struct','switch','template','this','throw','true','try','typedef','typename','union','unsigned','using','virtual','void','volatile','while','include','define','std','cout','cin','endl','string','vector'],
  csharp: ['abstract','as','base','bool','break','byte','case','catch','char','checked','class','const','continue','decimal','default','delegate','do','double','else','enum','event','explicit','extern','false','finally','fixed','float','for','foreach','goto','if','implicit','in','int','interface','internal','is','lock','long','namespace','new','null','object','operator','out','override','params','private','protected','public','readonly','ref','return','sbyte','sealed','short','sizeof','stackalloc','static','string','struct','switch','this','throw','true','try','typeof','uint','ulong','unchecked','unsafe','ushort','using','virtual','void','volatile','while','async','await','var','dynamic','partial','get','set','value','yield','from','where','select'],
  ruby: ['BEGIN','END','alias','and','begin','break','case','class','def','defined','do','else','elsif','end','ensure','false','for','if','in','module','next','nil','not','or','redo','rescue','retry','return','self','super','then','true','undef','unless','until','when','while','yield','puts','print','require','include','extend','attr_reader','attr_writer','attr_accessor'],
  kotlin: ['abstract','actual','annotation','as','break','by','catch','class','companion','const','constructor','continue','crossinline','data','do','else','enum','expect','external','false','final','finally','for','fun','get','if','import','in','infix','init','inline','inner','interface','internal','is','it','lateinit','noinline','null','object','open','operator','out','override','package','private','protected','public','reified','return','sealed','set','super','suspend','tailrec','this','throw','true','try','typealias','val','var','vararg','when','where','while','println','print','listOf','mapOf','setOf','String','Int','Long','Double','Float','Boolean','Unit','Any'],
  swift: ['associatedtype','class','deinit','enum','extension','fileprivate','func','import','init','inout','internal','let','open','operator','private','protocol','public','rethrows','static','struct','subscript','typealias','var','break','case','catch','continue','default','defer','do','else','fallthrough','for','guard','if','in','repeat','return','throw','switch','where','while','as','false','is','nil','rethrows','super','self','Self','true','try','String','Int','Double','Float','Bool','Array','Dictionary','Optional'],
  php: ['abstract','and','array','as','break','callable','case','catch','class','clone','const','continue','declare','default','die','do','echo','else','elseif','empty','endfor','endforeach','endif','endswitch','endwhile','extends','final','for','foreach','function','global','goto','if','implements','include','instanceof','interface','isset','list','namespace','new','or','print','private','protected','public','require','return','static','switch','throw','trait','try','unset','use','var','while','xor','yield','true','false','null','string','int','float','bool','self','parent','this'],
  sql: ['SELECT','FROM','WHERE','AND','OR','NOT','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','DROP','ALTER','ADD','COLUMN','INDEX','VIEW','DATABASE','USE','SHOW','JOIN','INNER','LEFT','RIGHT','FULL','OUTER','ON','GROUP','BY','ORDER','ASC','DESC','HAVING','LIMIT','OFFSET','DISTINCT','AS','NULL','IS','IN','BETWEEN','LIKE','EXISTS','UNION','ALL','CASE','WHEN','THEN','ELSE','END','COUNT','SUM','AVG','MAX','MIN','PRIMARY','KEY','FOREIGN','REFERENCES','UNIQUE','DEFAULT','INTEGER','TEXT','REAL','BOOLEAN','VARCHAR','CHAR','DATE','TIMESTAMP','ROUND','COALESCE'],
  bash: ['if','then','else','elif','fi','for','do','done','while','until','case','esac','in','function','return','break','continue','exit','echo','read','export','local','declare','readonly','source','alias','cd','ls','pwd','mkdir','rm','cp','mv','cat','grep','sed','awk','sort','find','chmod','sudo','true','false','test'],
  html: [],
  css: ['important','initial','inherit','unset','none','auto','normal','bold','italic','solid','dashed','dotted','hidden','visible','absolute','relative','fixed','sticky','static','flex','grid','block','inline','center','left','right','top','bottom','transparent','currentColor'],
}

const BUILTINS: Record<string, string[]> = {
  javascript: ['console','Math','Array','Object','String','Number','Boolean','Promise','fetch','setTimeout','setInterval','clearTimeout','clearInterval','JSON','parseInt','parseFloat','isNaN','Error','TypeError','Map','Set','Date','RegExp','window','document','process','Symbol','Proxy','Reflect'],
  typescript: ['console','Math','Array','Object','String','Number','Boolean','Promise','fetch','setTimeout','setInterval','JSON','parseInt','parseFloat','Error','TypeError','Map','Set','Date','RegExp','Record','Partial','Required','Readonly','Pick','Omit','Exclude','Extract','NonNullable','ReturnType','Parameters'],
  python: ['print','input','len','range','enumerate','zip','map','filter','sorted','reversed','list','dict','set','tuple','int','float','str','bool','type','isinstance','hasattr','getattr','setattr','open','abs','max','min','sum','round','all','any','chr','ord','hex','bin'],
  rust: ['println!','print!','eprintln!','format!','vec!','todo!','panic!','assert!','assert_eq!','dbg!'],
}

const LINE_COMMENTS: Record<string, string[]> = {
  javascript: ['//'], typescript: ['//'], rust: ['//'], go: ['//'],
  java: ['//'], cpp: ['//'], csharp: ['//'], kotlin: ['//'], swift: ['//'],
  python: ['#'], ruby: ['#'], bash: ['#'], php: ['//', '#'],
  sql: ['--'], html: [], css: [],
}

const BLOCK_COMMENTS: Record<string, [string, string][]> = {
  javascript: [['/*', '*/']],  typescript: [['/*', '*/']],
  java: [['/*', '*/']],        cpp: [['/*', '*/']],
  csharp: [['/*', '*/']],      go: [['/*', '*/']],
  rust: [['/*', '*/']],        swift: [['/*', '*/']],
  kotlin: [['/*', '*/']],      php: [['/*', '*/']],
  css: [['/*', '*/']],         html: [['<!--', '-->']],
  python: [],                   ruby: [],   sql: [],   bash: [],
}

const COLORS: Record<string, string> = {
  keyword:  '#c792ea',
  string:   '#c3e88d',
  comment:  '#546e7a',
  number:   '#f78c6c',
  function: '#82aaff',
  type:     '#ffcb6b',
  operator: '#89ddff',
  builtin:  '#ff9cac',
}

export function highlight(code: string, langId: string): string {
  const lang = langId.toLowerCase()
  const keywords = new Set(KEYWORDS[lang] || [])
  const builtins = new Set(BUILTINS[lang] || [])
  const lineComments = LINE_COMMENTS[lang] || []
  const blockComments = BLOCK_COMMENTS[lang] || []

  const parts: string[] = []
  let i = 0

  const push = (text: string, type?: string) => {
    const e = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    if (type && COLORS[type]) {
      parts.push(`<span style="color:${COLORS[type]}">${e}</span>`)
    } else {
      parts.push(e)
    }
  }

  while (i < code.length) {
    let found = false

    // Block comments
    for (const [open, close] of blockComments) {
      if (code.startsWith(open, i)) {
        const end = code.indexOf(close, i + open.length)
        const endIdx = end === -1 ? code.length : end + close.length
        push(code.slice(i, endIdx), 'comment')
        i = endIdx; found = true; break
      }
    }
    if (found) continue

    // Line comments
    for (const lc of lineComments) {
      if (code.startsWith(lc, i)) {
        const end = code.indexOf('\n', i)
        const endIdx = end === -1 ? code.length : end
        push(code.slice(i, endIdx), 'comment')
        i = endIdx; found = true; break
      }
    }
    if (found) continue

    // Triple-quoted strings (Python)
    if (lang === 'python') {
      for (const delim of ['"""', "'''"]) {
        if (code.startsWith(delim, i)) {
          const end = code.indexOf(delim, i + 3)
          const endIdx = end === -1 ? code.length : end + 3
          push(code.slice(i, endIdx), 'string')
          i = endIdx; found = true; break
        }
      }
      if (found) continue
    }

    const ch = code[i]

    // Strings
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1
      while (j < code.length) {
        if (code[j] === '\\') { j += 2; continue }
        if (code[j] === ch) { j++; break }
        if (code[j] === '\n' && ch !== '`') break
        j++
      }
      push(code.slice(i, j), 'string')
      i = j; continue
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(code[i + 1] || ''))) {
      const m = code.slice(i).match(/^(?:0x[\da-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*(?:[eE][+-]?\d+)?)/)
      if (m) { push(m[0], 'number'); i += m[0].length; continue }
    }

    // Identifiers / keywords / functions / types / builtins
    if (/[a-zA-Z_$@]/.test(ch)) {
      const m = code.slice(i).match(/^[a-zA-Z_$@][a-zA-Z0-9_$!?]*/)!
      const word = m[0]
      let type: string | undefined
      if (keywords.has(word) || (lang === 'sql' && keywords.has(word.toUpperCase()))) {
        type = 'keyword'
      } else if (builtins.has(word)) {
        type = 'builtin'
      } else if (/^[A-Z][A-Za-z0-9]*$/.test(word)) {
        type = 'type'
      } else if (code[i + word.length] === '(') {
        type = 'function'
      }
      push(word, type)
      i += word.length; continue
    }

    // Operators
    if (/[+\-*/%=<>!&|^~?:]/.test(ch)) {
      const ops = ['===','!==','=>','<=','>=','==','!=','&&','||','??','::','->','**','++','--','+=','-=','*=','/=','|>']
      let op = ch; let opLen = 1
      for (const candidate of ops) {
        if (code.startsWith(candidate, i)) { op = candidate; opLen = candidate.length; break }
      }
      push(op, 'operator')
      i += opLen; continue
    }

    push(ch)
    i++
  }

  return parts.join('')
}
